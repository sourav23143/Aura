"""
AuraAI — Health Check API Route
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.schemas import HealthResponse
from app.config import get_settings
from app.ai.embeddings.vectorstore import get_vectorstore_count
from app.ai.llm.provider import check_llm_connection
from app.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Application health check.
    Verifies DB, vector store, and LLM connectivity.
    """
    settings = get_settings()

    # Check DB
    db_ok = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    # Check ChromaDB
    chroma_ok = True
    try:
        get_vectorstore_count()
    except Exception:
        chroma_ok = False

    # Check LLM
    llm_ok = check_llm_connection()

    status = "healthy" if (db_ok and chroma_ok) else "degraded"

    return HealthResponse(
        status=status,
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        groq_connected=llm_ok,
        chroma_connected=chroma_ok,
        db_connected=db_ok,
    )
