"""
AuraAI — Recommendation Engine
Content-based recommendation system using embeddings + blended scoring.

Algorithm:
    1. Convert user profile to embedding vector
    2. Find top-K similar items via cosine similarity (ChromaDB)
    3. Apply blended scoring: similarity × 0.6 + category_match × 0.2 + recency × 0.2
    4. Generate AI explanations for each recommendation
"""

import logging
import time
from sqlalchemy import select, func
from app.db.session import async_session_factory
from app.models import UserInteraction
from app.ai.embeddings.vectorstore import search_vectorstore
from app.ai.llm.provider import get_llm
from app.ai.rag.prompts import RECOMMENDATION_PROMPT
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)


def _calculate_blended_score(
    similarity_score: float,
    category_match: bool = False,
    priority_match: bool = False,
    interaction_score: float = 0.0,
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
        similarity_score * 0.5
        + category_bonus * 0.15
        + priority_bonus * 0.15
        + min(interaction_score, 1.0) * 0.2
    )
    return round(min(blended, 1.0), 4)


async def generate_recommendations(
    description: str,
    category: str = None,
    budget_range: str = None,
    priorities: list[str] = None,
    top_k: int = 5,
    user_email: str = None,
    db: AsyncSession = None,
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

    # Get collaborative filtering data if user_email is provided
    interaction_counts = {}
    if user_email:
        try:
            if db:
                result = await db.execute(
                    select(UserInteraction.product_id, func.count(UserInteraction.id))
                    .where(UserInteraction.user_email == user_email)
                    .group_by(UserInteraction.product_id)
                )
                for row in result.all():
                    interaction_counts[row[0]] = min(row[1] * 0.2, 1.0)
            else:
                async with async_session_factory() as session:
                    result = await session.execute(
                        select(UserInteraction.product_id, func.count(UserInteraction.id))
                        .where(UserInteraction.user_email == user_email)
                        .group_by(UserInteraction.product_id)
                    )
                    for row in result.all():
                        interaction_counts[row[0]] = min(row[1] * 0.2, 1.0) # Cap at 1.0 boost
        except Exception as e:
            logger.error(f"Error fetching interactions: {e}")

    # Score and rank results
    scored_items = []
    for doc, raw_score in search_results:
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}

        # Check for category and priority matches
        item_category = metadata.get("category", "").lower()
        item_tags = [t.lower() for t in metadata.get("tags", [])]
        doc_id = metadata.get("doc_id", "unknown")

        cat_match = category and category.lower() == item_category
        priority_match = any(p.lower() in item_tags for p in priorities)
        
        # Add collaborative filtering score
        i_score = interaction_counts.get(doc_id, 0.0)

        blended_score = _calculate_blended_score(
            similarity_score=float(raw_score),
            category_match=cat_match,
            priority_match=priority_match,
            interaction_score=i_score,
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

    # Enrich recommendations with database fields (price_usd, image_url)
    from app.models import Document
    doc_ids = [item["id"] for item in top_items]
    if doc_ids:
        try:
            if db:
                docs_db = await db.execute(select(Document).where(Document.id.in_(doc_ids)))
                docs_map = {d.id: d for d in docs_db.scalars().all()}
                for item in top_items:
                    db_doc = docs_map.get(item["id"])
                    if db_doc and db_doc.metadata_json:
                        item["price_usd"] = db_doc.metadata_json.get("price_usd", 0)
                        item["image_url"] = db_doc.metadata_json.get("image_url", "")
                    else:
                        item["price_usd"] = 0
                        item["image_url"] = ""
            else:
                async with async_session_factory() as session:
                    docs_db = await session.execute(select(Document).where(Document.id.in_(doc_ids)))
                    docs_map = {d.id: d for d in docs_db.scalars().all()}
                    for item in top_items:
                        db_doc = docs_map.get(item["id"])
                        if db_doc and db_doc.metadata_json:
                            item["price_usd"] = db_doc.metadata_json.get("price_usd", 0)
                            item["image_url"] = db_doc.metadata_json.get("image_url", "")
                        else:
                            item["price_usd"] = 0
                            item["image_url"] = ""
        except Exception as e:
            logger.error(f"Error fetching product metadata for recommendations: {e}")
            for item in top_items:
                item["price_usd"] = 0
                item["image_url"] = ""

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
        
        # Only keep items that the LLM actually chose to recommend to fit the budget/needs
        recommended_items = []
        for item in top_items:
            if item["id"] in rec_reasons:
                item["reasoning"] = rec_reasons[item["id"]]
                recommended_items.append(item)
                
        # If the LLM failed to return valid IDs, fallback to top_items with polished descriptions
        if not recommended_items:
            for item in top_items:
                item["reasoning"] = f"This item is highly relevant to your procurement needs, scoring {item['relevance_score']:.0%} on our values alignment scale."
            recommended_items = top_items

    except Exception as e:
        logger.warning(f"Failed to generate AI insights: {e}")
        ai_insights = ai_response if 'ai_response' in locals() else "AI insights unavailable."
        recommended_items = top_items
        for item in recommended_items:
            item["reasoning"] = f"This item fits your B2B profile with a {item['relevance_score']:.0%} relevance score."

    latency_ms = (time.time() - start_time) * 1000

    return {
        "recommendations": recommended_items,
        "ai_insights": ai_insights,
        "profile_summary": profile_summary,
        "latency_ms": round(latency_ms, 2),
    }
