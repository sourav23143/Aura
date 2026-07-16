"""
AuraAI — RAG Pipeline
The core Retrieval-Augmented Generation pipeline using LangChain.

Architecture:
    User Query → Retriever (ChromaDB) → Re-rank → Prompt Template → LLM (Groq) → Response

This module provides:
    1. rag_search() — Search with AI-generated summary
    2. rag_chat() — Conversational RAG with memory
    3. rag_stream() — Streaming RAG for WebSocket chat
"""

import logging
import time
from typing import AsyncIterator

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage, AIMessage

from app.ai.embeddings.vectorstore import get_retriever, search_vectorstore
from app.ai.llm.provider import get_llm, get_streaming_llm
from app.ai.rag.prompts import RAG_SEARCH_PROMPT, RAG_CHAT_PROMPT, SUMMARY_PROMPT

logger = logging.getLogger(__name__)


def _format_docs(docs) -> str:
    """Format retrieved documents into a context string for the LLM."""
    if not docs:
        return "No relevant documents found in the knowledge base."

    formatted = []
    for i, doc in enumerate(docs, 1):
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}
        title = metadata.get("doc_title", metadata.get("title", "Untitled"))
        category = metadata.get("category", "General")

        formatted.append(
            f"[Source {i}] Title: {title} | Category: {category}\n"
            f"{doc.page_content}\n"
        )

    return "\n---\n".join(formatted)


def _format_chat_history(messages: list[dict]) -> list:
    """Convert message dicts to LangChain message objects."""
    history = []
    for msg in messages:
        if msg["role"] == "user":
            history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history.append(AIMessage(content=msg["content"]))
    return history


async def rag_search(
    query: str,
    top_k: int = 5,
    category_filter: str = None,
    generate_summary: bool = True,
) -> dict:
    """
    Perform RAG-powered semantic search.

    Steps:
    1. Search ChromaDB for semantically similar documents
    2. Optionally generate an AI summary of the results
    3. Return results with scores and optional summary

    Returns:
        {
            "results": [{"id", "title", "content", "category", "score", "metadata"}],
            "ai_summary": "AI-generated summary...",
            "latency_ms": 123.4
        }
    """
    start_time = time.time()

    # Build filter
    filter_dict = None
    if category_filter:
        filter_dict = {"category": category_filter}

    # Vector search
    search_results = search_vectorstore(
        query=query,
        k=top_k,
        filter_dict=filter_dict,
    )

    # Format results
    results = []
    for doc, score in search_results:
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}
        results.append({
            "id": metadata.get("doc_id", "unknown"),
            "title": metadata.get("doc_title", metadata.get("title", "Untitled")),
            "content": doc.page_content,
            "category": metadata.get("category", "General"),
            "score": round(float(score), 4),
            "metadata_json": {
                k: v for k, v in metadata.items()
                if k not in ("doc_id", "doc_title", "chunk_index", "total_chunks")
            },
        })

    # Generate AI summary if requested and we have results
    ai_summary = None
    if generate_summary and results:
        try:
            llm = get_llm()
            results_text = "\n".join(
                f"- {r['title']} ({r['category']}): {r['content'][:200]}..."
                for r in results[:5]
            )
            summary_chain = SUMMARY_PROMPT | llm | StrOutputParser()
            ai_summary = await summary_chain.ainvoke({
                "results": results_text,
                "query": query,
            })
        except Exception as e:
            logger.warning(f"Failed to generate AI summary: {e}")
            ai_summary = None

    latency_ms = (time.time() - start_time) * 1000

    return {
        "results": results,
        "ai_summary": ai_summary,
        "latency_ms": round(latency_ms, 2),
    }


async def rag_chat(
    question: str,
    chat_history: list[dict] = None,
    top_k: int = 5,
) -> dict:
    """
    Conversational RAG — answer a question using retrieved context + chat history.

    Steps:
    1. Retrieve relevant documents from ChromaDB
    2. Format chat history for continuity
    3. Generate response using LLM with context + history
    4. Return response with sources

    Returns:
        {
            "response": "AI response text...",
            "sources": [{"title", "category", "score"}],
            "latency_ms": 123.4
        }
    """
    start_time = time.time()

    # Retrieve context
    retriever = get_retriever(k=top_k)
    retrieved_docs = await retriever.ainvoke(question)
    context = _format_docs(retrieved_docs)

    # Format chat history
    history = _format_chat_history(chat_history or [])

    # Build and run the RAG chain
    llm = get_llm()
    chain = RAG_CHAT_PROMPT | llm | StrOutputParser()

    response = await chain.ainvoke({
        "context": context,
        "chat_history": history,
        "question": question,
    })

    # Extract sources
    sources = []
    for doc in retrieved_docs:
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}
        sources.append({
            "title": metadata.get("doc_title", "Untitled"),
            "category": metadata.get("category", "General"),
        })

    latency_ms = (time.time() - start_time) * 1000

    return {
        "response": response,
        "sources": sources,
        "latency_ms": round(latency_ms, 2),
    }


async def rag_stream(
    question: str,
    chat_history: list[dict] = None,
    top_k: int = 5,
) -> AsyncIterator[str]:
    """
    Streaming RAG — yields response tokens one by one.
    Used by the WebSocket chat endpoint for real-time streaming.

    Yields:
        Individual tokens as they're generated by the LLM.
    """
    # Retrieve context
    retriever = get_retriever(k=top_k)
    retrieved_docs = await retriever.ainvoke(question)
    context = _format_docs(retrieved_docs)

    # Format chat history
    history = _format_chat_history(chat_history or [])

    # Build streaming chain
    llm = get_streaming_llm()
    chain = RAG_CHAT_PROMPT | llm

    # Stream tokens
    async for chunk in chain.astream({
        "context": context,
        "chat_history": history,
        "question": question,
    }):
        if hasattr(chunk, 'content') and chunk.content:
            yield chunk.content
