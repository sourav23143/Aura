"""
CortexAI — Embedding Manager
Handles embedding generation using sentence-transformers (runs locally, FREE).
Provides a unified interface for embedding text documents and queries.
"""

import logging
from functools import lru_cache
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from app.config import get_settings

logger = logging.getLogger(__name__)

_embeddings_instance = None


def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """
    Get or create the embeddings model instance.
    Uses sentence-transformers/all-MiniLM-L6-v2 by default:
    - FREE (runs locally, no API key)
    - Fast (80+ sentences/sec on CPU)
    - 384-dimensional vectors
    - Good quality for semantic search
    """
    global _embeddings_instance

    if _embeddings_instance is None:
        settings = get_settings()
        logger.info(f"Loading embedding model: {settings.embedding_model}")

        _embeddings_instance = HuggingFaceEndpointEmbeddings(
            model=settings.embedding_model,
            huggingfacehub_api_token=settings.huggingface_api_key,
        )
        logger.info("Embedding model loaded successfully from Hugging Face API")

    return _embeddings_instance


def embed_text(text: str) -> list[float]:
    """Embed a single text string and return the vector."""
    embeddings = get_embeddings()
    return embeddings.embed_query(text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed multiple text strings and return their vectors."""
    embeddings = get_embeddings()
    return embeddings.embed_documents(texts)
