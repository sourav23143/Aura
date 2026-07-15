"""
CortexAI — LangGraph Multi-Agent Graph
Stateful, multi-step agent orchestration using LangGraph.

Architecture:
    ┌─────────┐     ┌────────┐     ┌──────────┐
    │  Router │────▶│ Search │────▶│ Respond  │
    │  Agent  │     │ Agent  │     │ (Format) │
    │         │     └────────┘     └──────────┘
    │         │     ┌────────┐     ┌──────────┐
    │         │────▶│  Chat  │────▶│ Respond  │
    │         │     │ Agent  │     │ (Format) │
    │         │     └────────┘     └──────────┘
    │         │     ┌────────┐     ┌──────────┐
    │         │────▶│Recomm. │────▶│ Respond  │
    └─────────┘     │ Agent  │     │ (Format) │
                    └────────┘     └──────────┘

Each node is a function that takes AgentState and returns updated AgentState.
"""

import logging
import time

from langgraph.graph import StateGraph, END
from langchain_core.output_parsers import StrOutputParser

from app.ai.agents.state import AgentState
from app.ai.llm.provider import get_llm
from app.ai.rag.prompts import ROUTER_PROMPT, RAG_SEARCH_PROMPT, RAG_CHAT_PROMPT, RECOMMENDATION_PROMPT
from app.ai.embeddings.vectorstore import search_vectorstore, get_retriever
from app.ai.rag.pipeline import _format_docs, _format_chat_history

logger = logging.getLogger(__name__)


# ─── Node 1: Router Agent ────────────────────────────────

async def router_node(state: AgentState) -> AgentState:
    """
    Classify user intent and decide which specialist agent to route to.
    Uses the LLM to classify into: search, chat, or recommend.
    """
    try:
        llm = get_llm()
        chain = ROUTER_PROMPT | llm | StrOutputParser()
        intent = await chain.ainvoke({"query": state["query"]})
        intent = intent.strip().lower()

        # Validate intent
        if intent not in ("search", "chat", "recommend"):
            intent = "chat"  # Default to chat for unclear intents

        logger.info(f"Router classified '{state['query'][:50]}...' as: {intent}")

        return {
            **state,
            "intent": intent,
            "nodes_visited": ["router"],
        }
    except Exception as e:
        logger.error(f"Router error: {e}")
        return {
            **state,
            "intent": "chat",  # Fallback to chat
            "nodes_visited": ["router"],
            "error": str(e),
        }


# ─── Node 2a: Search Agent ───────────────────────────────

async def search_node(state: AgentState) -> AgentState:
    """
    Handles search queries. Retrieves relevant docs and generates a search-focused response.
    """
    try:
        # Retrieve documents
        search_results = search_vectorstore(query=state["query"], k=5)

        docs = []
        retrieved_info = []
        for doc, score in search_results:
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            docs.append(doc)
            retrieved_info.append({
                "title": metadata.get("doc_title", "Untitled"),
                "category": metadata.get("category", "General"),
                "score": round(float(score), 4),
                "content_preview": doc.page_content[:200],
            })

        context = _format_docs(docs)

        # Generate search response
        llm = get_llm()
        chain = RAG_SEARCH_PROMPT | llm | StrOutputParser()
        response = await chain.ainvoke({
            "context": context,
            "question": state["query"],
        })

        return {
            **state,
            "retrieved_docs": retrieved_info,
            "agent_response": response,
            "nodes_visited": ["search_agent"],
        }
    except Exception as e:
        logger.error(f"Search agent error: {e}")
        return {
            **state,
            "agent_response": f"I encountered an issue while searching. Please try again. Error: {str(e)}",
            "nodes_visited": ["search_agent"],
            "error": str(e),
        }


# ─── Node 2b: Chat Agent ─────────────────────────────────

async def chat_node(state: AgentState) -> AgentState:
    """
    Handles conversational queries. Uses RAG with conversation memory.
    """
    try:
        # Retrieve relevant context
        retriever = get_retriever(k=5)
        retrieved_docs_raw = await retriever.ainvoke(state["query"])
        context = _format_docs(retrieved_docs_raw)

        # Format chat history
        history = _format_chat_history(state.get("chat_history", []))

        # Generate conversational response
        llm = get_llm()
        chain = RAG_CHAT_PROMPT | llm | StrOutputParser()
        response = await chain.ainvoke({
            "context": context,
            "chat_history": history,
            "question": state["query"],
        })

        # Extract doc info
        retrieved_info = []
        for doc in retrieved_docs_raw:
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            retrieved_info.append({
                "title": metadata.get("doc_title", "Untitled"),
                "category": metadata.get("category", "General"),
            })

        return {
            **state,
            "retrieved_docs": retrieved_info,
            "agent_response": response,
            "nodes_visited": ["chat_agent"],
        }
    except Exception as e:
        logger.error(f"Chat agent error: {e}")
        return {
            **state,
            "agent_response": f"I'm having trouble connecting right now. Please try again. Error: {str(e)}",
            "nodes_visited": ["chat_agent"],
            "error": str(e),
        }


# ─── Node 2c: Recommend Agent ────────────────────────────

async def recommend_node(state: AgentState) -> AgentState:
    """
    Handles recommendation queries. Finds matching items and generates
    personalized recommendations with explanations.
    """
    try:
        # Search for relevant items based on the query
        search_results = search_vectorstore(query=state["query"], k=8)

        items_text = []
        retrieved_info = []
        for doc, score in search_results:
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            item_info = {
                "id": metadata.get("doc_id", "unknown"),
                "title": metadata.get("doc_title", "Untitled"),
                "category": metadata.get("category", "General"),
                "score": round(float(score), 4),
                "content": doc.page_content[:300],
            }
            retrieved_info.append(item_info)
            items_text.append(
                f"- ID [{item_info['id']}] [{item_info['title']}] ({item_info['category']}): "
                f"{doc.page_content[:200]}... (relevance: {item_info['score']})"
            )

        # Build profile description
        profile = state.get("recommendation_profile", {})
        profile_text = profile.get("description", state["query"]) if profile else state["query"]
        if profile:
            if profile.get("budget_range"):
                profile_text += f"\nBudget: {profile['budget_range']}"
            if profile.get("priorities"):
                profile_text += f"\nPriorities: {', '.join(profile['priorities'])}"

        # Generate recommendations
        llm = get_llm()
        chain = RECOMMENDATION_PROMPT | llm | StrOutputParser()
        raw_response = await chain.ainvoke({
            "profile": profile_text,
            "items": "\n".join(items_text),
        })
        
        # Parse the JSON response to provide a natural language reply in chat
        import json
        import re
        
        json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        clean_json = json_match.group(0) if json_match else raw_response
        
        try:
            parsed = json.loads(clean_json)
            ai_insights = parsed.get("ai_insights", "Here are my recommendations based on your request.")
            recs = parsed.get("recommendations", [])
            
            response_text = f"{ai_insights}\n\n"
            for r in recs:
                response_text += f"- **{r.get('title', 'Product')}**: {r.get('reasoning', '')}\n"
        except Exception as e:
            logger.error(f"Could not parse recommendation JSON: {e}")
            response_text = "I have found some excellent products for you, but encountered an error formatting them. Please try again."

        return {
            **state,
            "retrieved_docs": retrieved_info,
            "recommendations": retrieved_info,
            "agent_response": response_text,
            "nodes_visited": ["recommend_agent"],
        }
    except Exception as e:
        logger.error(f"Recommend agent error: {e}")
        return {
            **state,
            "agent_response": f"I couldn't generate recommendations right now. Error: {str(e)}",
            "nodes_visited": ["recommend_agent"],
            "error": str(e),
        }


# ─── Node 3: Response Formatter ──────────────────────────

async def respond_node(state: AgentState) -> AgentState:
    """Final node that formats the response for output."""
    return {
        **state,
        "nodes_visited": ["respond"],
    }


# ─── Route Decision Function ─────────────────────────────

def route_decision(state: AgentState) -> str:
    """Decides which agent node to route to based on classified intent."""
    intent = state.get("intent", "chat")
    if intent == "search":
        return "search"
    elif intent == "recommend":
        return "recommend"
    else:
        return "chat"


# ─── Build the LangGraph ─────────────────────────────────

def build_agent_graph() -> StateGraph:
    """
    Construct the multi-agent LangGraph workflow.

    Graph:
        START → router → [search|chat|recommend] → respond → END
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("router", router_node)
    workflow.add_node("search", search_node)
    workflow.add_node("chat", chat_node)
    workflow.add_node("recommend", recommend_node)
    workflow.add_node("respond", respond_node)

    # Set entry point
    workflow.set_entry_point("router")

    # Add conditional routing from router
    workflow.add_conditional_edges(
        "router",
        route_decision,
        {
            "search": "search",
            "chat": "chat",
            "recommend": "recommend",
        },
    )

    # All agents route to respond
    workflow.add_edge("search", "respond")
    workflow.add_edge("chat", "respond")
    workflow.add_edge("recommend", "respond")

    # Respond → END
    workflow.add_edge("respond", END)

    return workflow.compile()


# ─── Public Interface ─────────────────────────────────────

# Compiled graph (singleton)
_agent_graph = None


def get_agent_graph():
    """Get or create the compiled agent graph."""
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
        logger.info("LangGraph agent graph compiled successfully")
    return _agent_graph


async def run_agent(
    query: str,
    session_id: str = "default",
    chat_history: list[dict] = None,
    recommendation_profile: dict = None,
) -> AgentState:
    """
    Run a query through the multi-agent system.

    Args:
        query: User's input query
        session_id: Session identifier for conversation tracking
        chat_history: Previous messages for context
        recommendation_profile: Optional profile for recommendation queries

    Returns:
        Complete AgentState with all processing results
    """
    start_time = time.time()

    graph = get_agent_graph()

    initial_state: AgentState = {
        "query": query,
        "session_id": session_id,
        "chat_history": chat_history or [],
        "intent": "",
        "retrieved_docs": [],
        "agent_response": "",
        "recommendation_profile": recommendation_profile,
        "recommendations": [],
        "nodes_visited": [],
        "latency_ms": 0,
        "token_count": 0,
        "error": None,
    }

    # Run the graph
    result = await graph.ainvoke(initial_state)

    # Calculate total latency
    result["latency_ms"] = round((time.time() - start_time) * 1000, 2)

    logger.info(
        f"Agent completed: intent={result['intent']}, "
        f"nodes={result['nodes_visited']}, "
        f"latency={result['latency_ms']}ms"
    )

    return result
