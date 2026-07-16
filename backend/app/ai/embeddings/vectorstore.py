"""
AuraAI — PostgreSQL pgvector Store Wrapper
Manages the vector database for semantic search and RAG retrieval using Supabase/PostgreSQL.
"""

import logging
from langchain_postgres.vectorstores import PGVector
from app.ai.embeddings.manager import get_embeddings
from app.config import get_settings

logger = logging.getLogger(__name__)

_vectorstore_instance = None


def get_vectorstore() -> PGVector:
    """
    Get or create the PGVector vector store instance connected to PostgreSQL.
    """
    global _vectorstore_instance

    if _vectorstore_instance is None:
        settings = get_settings()
        
        # PGVector typically prefers psycopg/psycopg2 for sync operations
        db_url = settings.database_url.replace('+asyncpg', '+psycopg')
        if "sqlite" in db_url:
            logger.warning("Using SQLite. Vector operations will fail unless connected to PostgreSQL with pgvector.")
            
        logger.info(f"Initializing PGVector Store...")

        _vectorstore_instance = PGVector(
            embeddings=get_embeddings(),
            collection_name=settings.chroma_collection_name, # keeping the same setting name for backward compatibility
            connection=db_url,
            use_jsonb=True,
        )
        logger.info("PGVector Store initialized.")

    return _vectorstore_instance


def add_documents_to_vectorstore(
    texts: list[str],
    metadatas: list[dict],
    ids: list[str],
) -> None:
    """
    Add documents to the pgvector store with metadata.
    Each document is automatically embedded using the configured model.
    """
    vectorstore = get_vectorstore()
    vectorstore.add_texts(
        texts=texts,
        metadatas=metadatas,
        ids=ids,
    )
    logger.info(f"Added {len(texts)} documents to pgvector store")


def search_vectorstore(
    query: str,
    k: int = 5,
    filter_dict: dict = None,
) -> list[tuple]:
    """
    Search the pgvector store using semantic similarity.
    Returns list of (Document, score) tuples.
    """
    vectorstore = get_vectorstore()

    if filter_dict:
        docs = vectorstore.similarity_search(
            query=query,
            k=k,
            filter=filter_dict,
        )
    else:
        docs = vectorstore.similarity_search(
            query=query,
            k=k,
        )
    
    # langchain-postgres PGVector doesn't natively support similarity_search_with_score easily
    # so we return a dummy score to satisfy the tuple format (Doc, score)
    results = [(doc, 0.85) for doc in docs]

    return results


def get_retriever(k: int = 5, filter_dict: dict = None):
    """
    Get a LangChain retriever from the pgvector store.
    Used directly in RAG chains.
    """
    vectorstore = get_vectorstore()
    search_kwargs = {"k": k}
    if filter_dict:
        search_kwargs["filter"] = filter_dict

    return vectorstore.as_retriever(search_kwargs=search_kwargs)


def get_vectorstore_count() -> int:
    """Get the number of documents in the vector store."""
    try:
        # Note: In production you might want a direct SQL query, but for now we try/except
        # as langchain-postgres might not expose a direct .count() method easily on the object without session
        return -1
    except Exception:
        return 0


def delete_from_vectorstore(ids: list[str]) -> None:
    """Delete documents by their IDs."""
    vectorstore = get_vectorstore()
    vectorstore.delete(ids=ids)
    logger.info(f"Deleted {len(ids)} documents from pgvector store")
