"""
CortexAI — Application Configuration
Loads settings from .env file using Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "CortexAI"
    app_env: str = "development"
    app_version: str = "1.0.0"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Database
    database_url: str = "sqlite+aiosqlite:///./cortexai.db"

    # LLM Settings
    groq_api_key: str | None = None
    huggingface_api_key: str | None = None
    llm_model: str = "llama-3.1-8b-instant"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 1024

    # Embeddings (local — no API key)
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "cortexai_docs"

    # RAG
    chunk_size: int = 500
    chunk_overlap: int = 50
    retriever_k: int = 5

    # Auth
    jwt_secret: str = "cortexai-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"

    @property
    def has_groq_key(self) -> bool:
        return bool(self.groq_api_key) and self.groq_api_key != "gsk_your_groq_api_key_here"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
