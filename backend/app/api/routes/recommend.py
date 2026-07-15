"""
CortexAI — Recommendation API Route
AI-powered personalized recommendations using embeddings + blended scoring.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import RecommendationProfile, RecommendationResponse, RecommendationItem
from app.ai.recommendations.engine import generate_recommendations
from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommend", tags=["Recommendations"])


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    profile: RecommendationProfile,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI-powered personalized recommendations.

    Submit a profile describing what you need, and the AI will:
    1. Search for semantically matching items
    2. Score and rank them using blended scoring
    3. Generate personalized explanations for each recommendation
    """
    result = await generate_recommendations(
        description=profile.description,
        category=profile.category,
        budget_range=profile.budget_range,
        priorities=profile.priorities,
        top_k=profile.top_k,
    )

    recommendations = [
        RecommendationItem(
            id=r["id"],
            title=r["title"],
            content=r["content"],
            category=r["category"],
            relevance_score=r["relevance_score"],
            reasoning=r["reasoning"],
        )
        for r in result["recommendations"]
    ]

    return RecommendationResponse(
        profile_summary=result["profile_summary"],
        recommendations=recommendations,
        ai_insights=result["ai_insights"],
        latency_ms=result["latency_ms"],
    )
