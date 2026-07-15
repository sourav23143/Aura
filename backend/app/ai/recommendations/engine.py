"""
CortexAI — Recommendation Engine
Content-based recommendation system using embeddings + blended scoring.

Algorithm:
    1. Convert user profile to embedding vector
    2. Find top-K similar items via cosine similarity (ChromaDB)
    3. Apply blended scoring: similarity × 0.6 + category_match × 0.2 + recency × 0.2
    4. Generate AI explanations for each recommendation
"""

import logging
import time
from app.ai.embeddings.vectorstore import search_vectorstore
from app.ai.llm.provider import get_llm
from app.ai.rag.prompts import RECOMMENDATION_PROMPT
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)


def _calculate_blended_score(
    similarity_score: float,
    category_match: bool = False,
    priority_match: bool = False,
) -> float:
    """
    Blend multiple scoring signals for better recommendations.

    Weights:
    - Semantic similarity: 60% (from embeddings)
    - Category match: 20% (if user specified a category preference)
    - Priority alignment: 20% (if item aligns with stated priorities)
    """
    category_bonus = 1.0 if category_match else 0.0
    priority_bonus = 1.0 if priority_match else 0.0

    blended = (
        similarity_score * 0.6
        + category_bonus * 0.2
        + priority_bonus * 0.2
    )
    return round(min(blended, 1.0), 4)


async def generate_recommendations(
    description: str,
    category: str = None,
    budget_range: str = None,
    priorities: list[str] = None,
    top_k: int = 5,
) -> dict:
    """
    Generate personalized recommendations based on user profile.

    Args:
        description: What the user is looking for (free text)
        category: Optional category filter
        budget_range: "low", "medium", "high"
        priorities: List of priorities like ["quality", "innovation"]
        top_k: Number of recommendations to return

    Returns:
        {
            "recommendations": [...],
            "ai_insights": "Overall analysis...",
            "profile_summary": "What the user needs...",
            "latency_ms": 123.4
        }
    """
    start_time = time.time()
    priorities = priorities or []

    # Build search query by combining description with priorities
    search_query = description
    if priorities:
        search_query += f" (priorities: {', '.join(priorities)})"
    if budget_range:
        search_query += f" (budget: {budget_range})"

    # Vector search for similar items
    filter_dict = None
    if category:
        filter_dict = {"category": category}

    search_results = search_vectorstore(
        query=search_query,
        k=top_k * 2,  # Fetch extra for re-ranking
        filter_dict=filter_dict,
    )

    # Score and rank results
    scored_items = []
    for doc, raw_score in search_results:
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}

        # Check for category and priority matches
        item_category = metadata.get("category", "").lower()
        item_tags = [t.lower() for t in metadata.get("tags", [])]

        cat_match = category and category.lower() == item_category
        priority_match = any(p.lower() in item_tags for p in priorities)

        blended_score = _calculate_blended_score(
            similarity_score=float(raw_score),
            category_match=cat_match,
            priority_match=priority_match,
        )

        scored_items.append({
            "id": metadata.get("doc_id", "unknown"),
            "title": metadata.get("doc_title", "Untitled"),
            "content": doc.page_content,
            "category": metadata.get("category", "General"),
            "relevance_score": blended_score,
            "raw_similarity": round(float(raw_score), 4),
            "reasoning": "",  # Will be filled by LLM
        })

    # Sort by blended score and take top-K
    scored_items.sort(key=lambda x: x["relevance_score"], reverse=True)
    top_items = scored_items[:top_k]

    # Generate AI insights
    ai_insights = ""
    profile_summary = description
    try:
        llm = get_llm()

        profile_text = f"Description: {description}"
        if category:
            profile_text += f"\nPreferred category: {category}"
        if budget_range:
            profile_text += f"\nBudget range: {budget_range}"
        if priorities:
            profile_text += f"\nPriorities: {', '.join(priorities)}"

        items_text = "\n".join(
            f"- ID [{item['id']}] {item['title']} ({item['category']}): {item['content'][:200]}... "
            f"[Relevance: {item['relevance_score']}]"
            for item in top_items
        )

        chain = RECOMMENDATION_PROMPT | llm | StrOutputParser()
        ai_response = await chain.ainvoke({
            "profile": profile_text,
            "items": items_text,
        })

        # Parse the JSON response
        import json
        import re
        
        # Try to extract JSON if wrapped in markdown
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        clean_json = json_match.group(0) if json_match else ai_response
        
        parsed = json.loads(clean_json)
        ai_insights = parsed.get("ai_insights", "Here is your customized procurement proposal.")
        
        # Map generated reasoning back to the top_items
        rec_reasons = {r.get("id"): r.get("reasoning") for r in parsed.get("recommendations", [])}
        for item in top_items:
            item["reasoning"] = rec_reasons.get(item["id"]) or (
                f"This item scored {item['relevance_score']:.0%} relevance."
            )

    except Exception as e:
        logger.warning(f"Failed to generate AI insights: {e}")
        ai_insights = ai_response if 'ai_response' in locals() else "AI insights unavailable."
        for item in top_items:
            item["reasoning"] = f"Relevance score: {item['relevance_score']:.0%}"

    latency_ms = (time.time() - start_time) * 1000

    return {
        "recommendations": top_items,
        "ai_insights": ai_insights,
        "profile_summary": profile_summary,
        "latency_ms": round(latency_ms, 2),
    }
