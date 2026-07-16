"""
AuraAI — Recommendation API Route
AI-powered personalized recommendations using embeddings + blended scoring.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel
from app.schemas import RecommendationProfile, RecommendationResponse, RecommendationItem
from app.ai.recommendations.engine import generate_recommendations
from app.models import UserInteraction
from app.db.session import get_db

logger = logging.getLogger(__name__)

class InteractionCreate(BaseModel):
    user_email: str
    product_id: str
    interaction_type: str

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
        user_email=profile.user_email,
        db=db,
    )

    recommendations = [
        RecommendationItem(
            id=r["id"],
            title=r["title"],
            content=r["content"],
            category=r["category"],
            relevance_score=r["relevance_score"],
            reasoning=r["reasoning"],
            price_usd=r.get("price_usd", 0),
            image_url=r.get("image_url", ""),
        )
        for r in result["recommendations"]
    ]

    return RecommendationResponse(
        profile_summary=result["profile_summary"],
        recommendations=recommendations,
        ai_insights=result["ai_insights"],
        latency_ms=result["latency_ms"],
    )

@router.post("/interaction")
async def track_interaction(
    interaction: InteractionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a user interaction (VIEW, CART, PURCHASE)."""
    new_interaction = UserInteraction(
        user_email=interaction.user_email,
        product_id=interaction.product_id,
        interaction_type=interaction.interaction_type
    )
    db.add(new_interaction)
    await db.commit()
    return {"message": "Interaction tracked successfully"}
