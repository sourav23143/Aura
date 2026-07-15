"""
CortexAI — Chat API Route
WebSocket-based streaming chat + REST fallback, powered by RAG.
"""

import json
import uuid
import logging
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas import ChatRequest, ChatResponse
from app.ai.rag.pipeline import rag_chat, rag_stream
from app.ai.agents.graph import run_agent
from app.models import Conversation, Message, AgentLog
from app.db.session import get_db, async_session_factory

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Non-streaming chat endpoint (REST).
    Sends the message through the LangGraph agent system.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # Load chat history from DB
    chat_history = await _load_chat_history(db, session_id)

    # Run through agent
    result = await run_agent(
        query=request.message,
        session_id=session_id,
        chat_history=chat_history,
    )

    # Save to DB
    await _save_message(db, session_id, "user", request.message)
    await _save_message(db, session_id, "assistant", result["agent_response"])

    # Log agent activity
    agent_log = AgentLog(
        session_id=session_id,
        query=request.message,
        intent_detected=result["intent"],
        agent_used=result["intent"] + "_agent",
        nodes_visited=result["nodes_visited"],
        context_retrieved=[d.get("title", "") for d in result["retrieved_docs"][:5]],
        response_preview=result["agent_response"][:500],
        latency_ms=result["latency_ms"],
    )
    db.add(agent_log)

    return ChatResponse(
        response=result["agent_response"],
        session_id=session_id,
        sources=result["retrieved_docs"][:5],
        agent_used=result["intent"],
        latency_ms=result["latency_ms"],
    )


class SuggestionRequest(BaseModel):
    last_message: str

@router.post("/suggestions")
async def generate_suggestions(req: SuggestionRequest):
    """Generate 3 quick follow-up questions based on the last assistant response."""
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    from app.config import get_settings
    
    settings = get_settings()
    llm = ChatGroq(
        model="llama-3.1-8b-instant", 
        temperature=0.7, 
        max_tokens=150,
        api_key=settings.groq_api_key
    )
    
    prompt = f"""
    You are an AI assistant for a B2B educational infrastructure platform called Aura.
    The assistant just said: "{req.last_message[:500]}"
    
    Generate EXACTLY 3 short, natural follow-up questions (under 10 words each) the user might ask next.
    Format as a JSON array of strings: ["Question 1?", "Question 2?", "Question 3?"]
    Do not output any markdown formatting or extra text, just the raw JSON array.
    """
    
    try:
        res = await llm.ainvoke([HumanMessage(content=prompt)])
        # Clean the response to ensure valid JSON (remove markdown blocks if present)
        content = res.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        suggestions = json.loads(content)
        if isinstance(suggestions, list) and len(suggestions) >= 3:
            return {"suggestions": suggestions[:3]}
    except Exception as e:
        logger.error(f"Failed to generate suggestions: {e}")
        
    # Fallback suggestions
    return {"suggestions": [
        "Can you give me a discount?",
        "What are the warranty terms?",
        "Tell me more about the technical specs."
    ]}

class AutocompleteRequest(BaseModel):
    query: str

@router.post("/autocomplete")
async def chat_autocomplete(req: AutocompleteRequest):
    """Generate autocomplete predictions based on user typing."""
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage
    from app.config import get_settings
    
    if not req.query or len(req.query.strip()) < 2:
        return {"suggestions": []}
        
    settings = get_settings()
    llm = ChatGroq(
        model="llama-3.1-8b-instant", 
        temperature=0.7, 
        max_tokens=100,
        api_key=settings.groq_api_key
    )
    
    prompt = f"""
    The user is typing in a chat window for an educational infrastructure platform.
    They have typed: "{req.query}"
    
    Predict 3 full questions they might be trying to ask.
    Format as a JSON array of 3 strings. Only output JSON.
    """
    
    try:
        res = await llm.ainvoke([HumanMessage(content=prompt)])
        content = res.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        suggestions = json.loads(content)
        if isinstance(suggestions, list) and len(suggestions) >= 3:
            return {"suggestions": suggestions[:3]}
    except Exception as e:
        logger.error(f"Failed to generate autocomplete: {e}")
        
    return {"suggestions": []}

@router.websocket("/ws/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for streaming chat.
    Sends response tokens one-by-one for real-time typing effect.

    Protocol:
        Client sends: {"message": "user query"}
        Server streams: {"type": "token", "content": "word "}
        Server ends with: {"type": "done", "session_id": "..."}
    """
    await websocket.accept()
    logger.info(f"WebSocket connected: session={session_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")

            if not user_message:
                await websocket.send_json({"type": "error", "content": "Empty message"})
                continue

            # Send start signal
            await websocket.send_json({"type": "start", "content": ""})

            # Load chat history
            async with async_session_factory() as db:
                chat_history = await _load_chat_history(db, session_id)

                # Run through LangGraph agent for full routing
                result = await run_agent(
                    query=user_message,
                    session_id=session_id,
                    chat_history=chat_history,
                )
                
                full_response = result["agent_response"]

                # Simulate streaming to maintain the UI typing effect
                words = full_response.split(" ")
                for i, word in enumerate(words):
                    token = word + (" " if i < len(words) - 1 else "")
                    await websocket.send_json({
                        "type": "token",
                        "content": token,
                    })
                    await asyncio.sleep(0.01)  # 10ms delay per word

                # Save messages
                await _save_message(db, session_id, "user", user_message)
                await _save_message(db, session_id, "assistant", full_response)
                
                # Log agent activity for the Monitor dashboard
                agent_log = AgentLog(
                    session_id=session_id,
                    query=user_message,
                    intent_detected=result["intent"],
                    agent_used=result["intent"] + "_agent",
                    nodes_visited=result["nodes_visited"],
                    context_retrieved=[d.get("title", "") for d in result.get("retrieved_docs", [])[:5]],
                    response_preview=full_response[:500],
                    latency_ms=result["latency_ms"],
                )
                db.add(agent_log)
                await db.commit()

            # Send completion signal
            await websocket.send_json({
                "type": "done",
                "session_id": session_id,
            })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: session={session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": str(e)})
        except Exception:
            pass


# ─── Helper Functions ─────────────────────────────────────

async def _load_chat_history(db: AsyncSession, session_id: str, limit: int = 10) -> list[dict]:
    """Load recent chat history from DB for conversation memory."""
    # Find or create conversation
    result = await db.execute(
        select(Conversation).where(Conversation.session_id == session_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        return []

    # Get recent messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()

    # Return in chronological order
    return [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(messages)
    ]


async def _save_message(db: AsyncSession, session_id: str, role: str, content: str):
    """Save a message to the conversation history."""
    # Find or create conversation
    result = await db.execute(
        select(Conversation).where(Conversation.session_id == session_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(session_id=session_id)
        db.add(conversation)
        await db.flush()  # Get the ID

    # Add message
    message = Message(
        conversation_id=conversation.id,
        role=role,
        content=content,
    )
    db.add(message)
