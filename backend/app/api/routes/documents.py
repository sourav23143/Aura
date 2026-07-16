"""
AuraAI — Documents API Route
CRUD operations for documents in the knowledge base.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.schemas import DocumentCreate, DocumentResponse, DocumentList
from app.models import Document, Review
from app.ai.rag.chunker import chunk_document
from app.ai.embeddings.vectorstore import add_documents_to_vectorstore, delete_from_vectorstore
from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=DocumentList)
async def list_documents(
    category: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """List all documents, optionally filtered by category."""
    query = (
        select(
            Document,
            func.coalesce(func.avg(Review.rating), 0.0).label("average_rating"),
            func.count(Review.id).label("review_count")
        )
        .outerjoin(Review, Document.id == Review.product_id)
        .group_by(Document.id)
    )
    if category:
        query = query.where(Document.category == category)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    documents_resp = []
    for doc, avg_rating, rev_count in rows:
        d_dict = DocumentResponse.model_validate(doc).model_dump()
        d_dict["average_rating"] = float(avg_rating)
        d_dict["review_count"] = int(rev_count)
        documents_resp.append(DocumentResponse(**d_dict))

    # Count total
    count_query = select(func.count(Document.id))
    if category:
        count_query = count_query.where(Document.category == category)
    total = (await db.execute(count_query)).scalar()

    return DocumentList(
        documents=documents_resp,
        total=total,
    )


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Get all unique categories."""
    result = await db.execute(
        select(Document.category, func.count(Document.id))
        .group_by(Document.category)
    )
    categories = {row[0]: row[1] for row in result.all()}
    return {"categories": categories}


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single document by ID."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse.model_validate(document)


@router.post("/", response_model=DocumentResponse, status_code=201)
async def create_document(
    doc_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new document and embed it into the vector store.
    The document is automatically chunked and embedded for semantic search.
    """
    # Check if custom ID already exists
    dump = doc_data.model_dump()
    if dump.get("id"):
        # Convert custom ID to lowercase as storefront convention
        dump["id"] = dump["id"].strip().lower()
        existing = await db.execute(select(Document).where(Document.id == dump["id"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"SKU / Product ID '{doc_data.id}' already exists.")
    else:
        # Remove None or empty string so SQLAlchemy generates UUID
        dump.pop("id", None)

    # Create DB record
    document = Document(**dump)
    db.add(document)
    await db.flush()

    # Chunk and embed
    chunks = chunk_document(
        text=doc_data.content,
        metadata={
            "doc_id": document.id,
            "doc_title": doc_data.title,
            "category": doc_data.category,
            "subcategory": doc_data.subcategory or "",
            "tags": doc_data.tags,
        },
    )

    if chunks:
        add_documents_to_vectorstore(
            texts=[c["text"] for c in chunks],
            metadatas=[c["metadata"] for c in chunks],
            ids=[f"{document.id}_chunk_{c['metadata']['chunk_index']}" for c in chunks],
        )
        document.is_embedded = True

    await db.commit()
    await db.refresh(document)

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document from both DB and vector store."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from vector store
    try:
        # Get all chunk IDs for this document
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(20)]
        delete_from_vectorstore(chunk_ids)
    except Exception as e:
        logger.warning(f"Could not delete from vector store: {e}")

    # Delete from DB
    await db.delete(document)
    await db.commit()

    return {"message": f"Document {document_id} deleted"}

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    doc_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing document."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Update fields
    document.title = doc_data.title
    document.content = doc_data.content
    document.category = doc_data.category
    document.subcategory = doc_data.subcategory
    document.tags = doc_data.tags
    document.metadata_json = doc_data.metadata_json

    await db.commit()
    await db.refresh(document)

    return DocumentResponse.model_validate(document)
