"""
AuraAI — Search API Route
Semantic search powered by RAG pipeline + ChromaDB vector search.
"""

import time
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import SearchRequest, SearchResponse, SearchResult
from app.ai.rag.pipeline import rag_search
from app.ai.agents.graph import run_agent
from app.models import SearchLog
from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Perform AI-powered semantic search.

    Accepts natural language queries and returns semantically relevant results
    with an optional AI-generated summary.
    """
    result = await rag_search(
        query=request.query,
        top_k=request.top_k,
        category_filter=request.category,
        generate_summary=request.use_ai_summary,
    )

    # Enrich results with database fields (price_usd, image_url)
    from sqlalchemy import select
    from app.models import Document
    
    doc_ids = [r["id"] for r in result["results"]]
    if doc_ids:
        docs_db = await db.execute(select(Document).where(Document.id.in_(doc_ids)))
        docs_map = {d.id: d for d in docs_db.scalars().all()}
        
        for r in result["results"]:
            db_doc = docs_map.get(r["id"])
            if db_doc and db_doc.metadata_json:
                r["metadata_json"]["price_usd"] = db_doc.metadata_json.get("price_usd", 0)
                r["metadata_json"]["image_url"] = db_doc.metadata_json.get("image_url", "")

    # Log search for analytics
    search_log = SearchLog(
        query=request.query,
        results_count=len(result["results"]),
        top_result_score=result["results"][0]["score"] if result["results"] else None,
        latency_ms=result["latency_ms"],
    )
    db.add(search_log)
    await db.commit()

    return SearchResponse(
        query=request.query,
        results=[SearchResult(**r) for r in result["results"]],
        ai_summary=result["ai_summary"],
        total_results=len(result["results"]),
        latency_ms=result["latency_ms"],
    )


@router.post("/agent")
async def agent_search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run the query through the full LangGraph multi-agent system.
    The agent automatically detects intent and routes to the appropriate specialist.
    """
    result = await run_agent(
        query=request.query,
        session_id="search-api",
    )

    return {
        "query": request.query,
        "intent_detected": result["intent"],
        "response": result["agent_response"],
        "nodes_visited": result["nodes_visited"],
        "retrieved_docs": result["retrieved_docs"],
        "latency_ms": result["latency_ms"],
    }
