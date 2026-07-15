"""
CortexAI — Main FastAPI Application

A modular, production-grade AI platform featuring:
• RAG pipelines (LangChain + ChromaDB + Groq)
• Multi-agent orchestration (LangGraph)
• Semantic search (sentence-transformers embeddings)
• AI-powered recommendations (embedding similarity + blended scoring)
• Streaming chat (WebSocket + conversation memory)
• Agent monitoring dashboard

Tech Stack: FastAPI | LangChain | LangGraph | ChromaDB | Groq | SQLAlchemy

Author: CortexAI
License: MIT
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.session import init_db, close_db, async_session_factory
from app.db.seed import seed_documents

from app.api.routes.health import router as health_router
from app.api.routes.search import router as search_router
from app.api.routes.chat import router as chat_router
from app.api.routes.recommend import router as recommend_router
from app.api.routes.documents import router as documents_router
from app.api.routes.agents import router as agents_router
from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.api.quotes import router as quotes_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("cortexai")


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
    title="CortexAI",
    description=(
        "🧠 **CortexAI** — A modular AI/ML engineering platform featuring "
        "RAG pipelines, multi-agent orchestration, semantic search, and "
        "intelligent recommendations.\n\n"
        "**AI/ML Stack:** LangChain · LangGraph · ChromaDB · Groq · sentence-transformers\n\n"
        "**Features:**\n"
        "- 🔍 Semantic Search (vector similarity)\n"
        "- 🤖 AI Chatbot (RAG + streaming)\n"
        "- 🎯 AI Recommendations (embedding-based scoring)\n"
        "- 🔄 Multi-Agent System (LangGraph state machine)\n"
        "- 📊 Agent Monitoring Dashboard\n"
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


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — welcome message."""
    return {
        "name": "CortexAI",
        "version": settings.app_version,
        "description": "AI/ML Engineering Platform",
        "features": [
            "🔍 Semantic Search (RAG + Vector DB)",
            "🤖 AI Chatbot (LangChain + Streaming)",
            "🎯 AI Recommendations (Embedding-based)",
            "🔄 Multi-Agent System (LangGraph)",
            "📊 Agent Monitoring Dashboard",
        ],
        "docs": "/docs",
        "health": "/health",
    }
