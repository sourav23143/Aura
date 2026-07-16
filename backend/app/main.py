"""
AuraAI — Main FastAPI Application

A modular, production-grade AI platform featuring:
• RAG pipelines (LangChain + pgvector + Groq)
• Multi-agent orchestration (LangGraph)
• NLP Pipelines (Hugging Face Sentiment Analysis)
• AI-powered recommendations (Hybrid vector + collaborative filtering)
• NL2SQL Analytics (Llama-3 text to raw SQL execution)
• Streaming chat (WebSocket + conversation memory)
• Admin Dashboard & Inventory CRUD

Tech Stack: FastAPI | LangChain | LangGraph | PostgreSQL/Supabase | Hugging Face | Groq

Author: AuraAI
License: MIT
"""

import logging
from contextlib import asynccontextmanager
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.session import init_db, close_db, async_session_factory
from app.db.seed import seed_documents
from app.db.seed_reviews import seed_demo_reviews

from app.api.routes.health import router as health_router
from app.api.routes.search import router as search_router
from app.api.routes.chat import router as chat_router
from app.api.routes.recommend import router as recommend_router
from app.api.routes.documents import router as documents_router
from app.api.routes.agents import router as agents_router
from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.api.quotes import router as quotes_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.reviews import router as reviews_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("auraai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    - Startup: Initialize DB, seed data, load AI models
    - Shutdown: Clean up connections
    """
    settings = get_settings()
    logger.info(f"🧠 Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"   Environment: {settings.app_env}")
    logger.info(f"   LLM: {settings.llm_model} via Groq")
    logger.info(f"   Embeddings: {settings.embedding_model} (local)")
    logger.info(f"   Groq API Key: {'✅ configured' if settings.has_groq_key else '❌ not set'}")

    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")

    # Seed data
    async with async_session_factory() as session:
        seed_result = await seed_documents(session)
        logger.info(
            f"✅ Data seeded: {seed_result['db_count']} docs in DB, "
            f"{seed_result['vector_count']} chunks in vector store"
        )

    # Seed demo reviews for sentiment analysis testing
    async with async_session_factory() as session:
        review_result = await seed_demo_reviews(session)
        if review_result['newly_added'] > 0:
            logger.info(f"✅ Demo reviews seeded: {review_result['newly_added']} reviews with sentiment labels")
        else:
            logger.info(f"✅ Reviews: {review_result['review_count']} already in DB")

    logger.info(f"🚀 {settings.app_name} is ready!")
    logger.info(f"   📖 API Docs:   http://localhost:8000/docs")
    logger.info(f"   📘 ReDoc:      http://localhost:8000/redoc")
    logger.info(f"   ❤️  Health:     http://localhost:8000/health")

    yield

    # Shutdown
    await close_db()
    logger.info(f"👋 {settings.app_name} shut down gracefully")


# Create FastAPI app
settings = get_settings()

app = FastAPI(
    title="AuraAI",
    description=(
        "🧠 **AuraAI** — A modular AI/ML engineering platform featuring "
        "RAG pipelines, multi-agent orchestration, semantic search, and "
        "intelligent recommendations.\n\n"
        "**AI/ML Stack:** LangChain · LangGraph · Supabase (pgvector) · Groq (Llama-3) · Hugging Face\n\n"
        "**Features:**\n"
        "- 🔍 Semantic Search (vector similarity)\n"
        "- 🤖 AI Chatbot (RAG + streaming)\n"
        "- 🎯 Hybrid AI Recommendations (vector + collaborative filtering)\n"
        "- 🔄 Multi-Agent System (LangGraph state machine)\n"
        "- 📊 AI Analytics (NL2SQL translation)\n"
        "- 🎭 Sentiment Analysis (Hugging Face classification)\n"
        "- 🛒 Secure Admin Portal & Inventory Management\n"
    ),
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(search_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(recommend_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(quotes_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — welcome message."""
    return {
        "name": "AuraAI",
        "version": settings.app_version,
        "description": "AI/ML Engineering Platform",
        "features": [
            "🔍 Semantic Search (RAG + pgvector)",
            "🤖 AI Chatbot (LangChain + Streaming)",
            "🎯 Hybrid AI Recommendations",
            "🔄 Multi-Agent System (LangGraph)",
            "📊 AI Analytics (NL2SQL)",
            "🎭 Sentiment Analysis",
            "🛒 Admin Portal"
        ],
        "docs": "/docs",
        "health": "/health",
    }
