"""
AuraAI — LLM Provider
Abstraction layer for LLM access. Currently uses Groq (free tier).
Designed to be swappable — can switch to OpenAI, Ollama, etc.
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.language_models import BaseChatModel
from app.config import get_settings

logger = logging.getLogger(__name__)

_llm_instance = None


def get_llm() -> BaseChatModel:
    """
    Get or create the LLM instance.

    Uses Groq's free API with llama-3.3-70b-versatile:
    - FREE: 30 requests/min, 14,400 requests/day
    - Fast: ~300 tokens/sec (fastest inference available)
    - Quality: 70B parameter model — excellent for RAG and chat
    """
    global _llm_instance

    if _llm_instance is None:
        settings = get_settings()

        if not settings.has_groq_key:
            logger.warning(
                "⚠️  No Groq API key found! Set GROQ_API_KEY in .env. "
                "Get a free key at https://console.groq.com"
            )
            # Return a mock-capable instance that will error gracefully
            _llm_instance = ChatGroq(
                model=settings.llm_model,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                api_key="not-set",
            )
        else:
            _llm_instance = ChatGroq(
                model=settings.llm_model,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                api_key=settings.groq_api_key,
            )
            logger.info(f"LLM initialized: {settings.llm_model} via Groq")

    return _llm_instance


def get_streaming_llm() -> BaseChatModel:
    """
    Get an LLM instance configured for streaming responses.
    Used by the WebSocket chat endpoint for token-by-token output.
    """
    settings = get_settings()

    return ChatGroq(
        model=settings.llm_model,
        temperature=settings.llm_temperature,
        max_tokens=settings.llm_max_tokens,
        api_key=settings.groq_api_key if settings.has_groq_key else "not-set",
        streaming=True,
    )


def check_llm_connection() -> bool:
    """Check if the LLM is properly configured and reachable."""
    settings = get_settings()
    return settings.has_groq_key
