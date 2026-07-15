"""
CortexAI — Document Chunker
Splits documents into optimal chunks for embedding and retrieval.
Uses LangChain's RecursiveCharacterTextSplitter with configurable settings.
"""

import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings

logger = logging.getLogger(__name__)


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    """
    Create a text splitter optimized for RAG retrieval.

    Strategy:
    - chunk_size=500: Small enough for precise retrieval, large enough for context
    - chunk_overlap=50: Prevents losing context at chunk boundaries
    - Separators: Prioritizes paragraph > sentence > word boundaries
    """
    settings = get_settings()

    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", ", ", " ", ""],
        is_separator_regex=False,
    )


def chunk_document(
    text: str,
    metadata: dict = None,
) -> list[dict]:
    """
    Split a document into chunks with metadata.

    Returns list of dicts:
    [
        {"text": "chunk text...", "metadata": {**original_metadata, "chunk_index": 0}},
        {"text": "chunk text...", "metadata": {**original_metadata, "chunk_index": 1}},
    ]
    """
    splitter = get_text_splitter()
    chunks = splitter.split_text(text)

    base_metadata = metadata or {}
    result = []

    for i, chunk in enumerate(chunks):
        chunk_metadata = {
            **base_metadata,
            "chunk_index": i,
            "total_chunks": len(chunks),
        }
        result.append({
            "text": chunk.strip(),
            "metadata": chunk_metadata,
        })

    logger.info(
        f"Chunked document into {len(result)} pieces "
        f"(original length: {len(text)} chars)"
    )
    return result


def chunk_documents(
    documents: list[dict],
) -> list[dict]:
    """
    Chunk multiple documents at once.
    Each input dict should have 'text', 'metadata', and 'id' keys.

    Returns flat list of all chunks with doc_id preserved in metadata.
    """
    all_chunks = []

    for doc in documents:
        doc_metadata = {
            **doc.get("metadata", {}),
            "doc_id": doc.get("id", "unknown"),
            "doc_title": doc.get("title", ""),
        }
        chunks = chunk_document(doc["text"], doc_metadata)
        all_chunks.extend(chunks)

    logger.info(
        f"Chunked {len(documents)} documents into {len(all_chunks)} total chunks"
    )
    return all_chunks
