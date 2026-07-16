"""
AuraAI — Database Seeder
Loads seed data into SQLite + ChromaDB on first run.
"""

import json
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Document
from app.ai.rag.chunker import chunk_document
from app.ai.embeddings.vectorstore import add_documents_to_vectorstore, get_vectorstore_count

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).parent.parent.parent / "data" / "seed"


async def seed_documents(db: AsyncSession) -> dict:
    """
    Load seed documents into the database and vector store.
    Skips if documents already exist.

    Returns:
        {"db_count": int, "vector_count": int, "newly_added": int}
    """
    # Check if already seeded
    result = await db.execute(select(func.count(Document.id)))
    existing_count = result.scalar()

    if existing_count > 0:
        vector_count = get_vectorstore_count()
        logger.info(
            f"Database already seeded: {existing_count} docs in DB, "
            f"{vector_count} chunks in vector store"
        )
        return {
            "db_count": existing_count,
            "vector_count": vector_count,
            "newly_added": 0,
        }

    # Load seed file
    seed_file = SEED_DIR / "documents.json"
    if not seed_file.exists():
        logger.warning(f"Seed file not found: {seed_file}")
        return {"db_count": 0, "vector_count": 0, "newly_added": 0}

    with open(seed_file, "r", encoding="utf-8") as f:
        documents_data = json.load(f)

    logger.info(f"Seeding {len(documents_data)} documents...")

    # Insert into SQLite
    all_chunks_texts = []
    all_chunks_metadatas = []
    all_chunks_ids = []

    for doc_data in documents_data:
        # Create DB record
        doc = Document(
            id=doc_data["id"],
            title=doc_data["title"],
            content=doc_data["content"],
            category=doc_data["category"],
            subcategory=doc_data.get("subcategory"),
            tags=doc_data.get("tags", []),
            metadata_json={
                **doc_data.get("metadata_json", {}),
                "price_usd": doc_data.get("price_usd"),
                "target_level": doc_data.get("target_level"),
                "image_url": doc_data.get("image_url")
            },
            source=doc_data.get("source"),
            is_embedded=True,
        )
        db.add(doc)

        # Chunk for vector store
        chunk_metadata = {
            "doc_id": doc_data["id"],
            "doc_title": doc_data["title"],
            "category": doc_data["category"],
            "subcategory": doc_data.get("subcategory", ""),
        }
        
        # ChromaDB crashes if we pass an empty list [] in metadata
        tags = doc_data.get("tags", [])
        if tags:
            chunk_metadata["tags"] = tags

        chunks = chunk_document(
            text=doc_data["content"],
            metadata=chunk_metadata,
        )

        for chunk in chunks:
            chunk_id = f"{doc_data['id']}_chunk_{chunk['metadata']['chunk_index']}"
            all_chunks_texts.append(chunk["text"])
            all_chunks_metadatas.append(chunk["metadata"])
            all_chunks_ids.append(chunk_id)

    # Commit to DB
    await db.commit()
    logger.info(f"Inserted {len(documents_data)} documents into database")

    # Add to vector store (batch)
    if all_chunks_texts:
        add_documents_to_vectorstore(
            texts=all_chunks_texts,
            metadatas=all_chunks_metadatas,
            ids=all_chunks_ids,
        )
        logger.info(f"Embedded {len(all_chunks_texts)} chunks into vector store")

    vector_count = get_vectorstore_count()

    return {
        "db_count": len(documents_data),
        "vector_count": vector_count,
        "newly_added": len(documents_data),
    }
