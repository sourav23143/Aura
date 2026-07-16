"""
AuraAI — Database Models
SQLAlchemy models for documents, conversations, users, and analytics.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Integer, DateTime, JSON, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    """Represents a document/product/item in the knowledge base."""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)  # ["STEM", "lab", "science"]
    metadata_json = Column(JSON, default=dict)  # price, region, specs, etc.
    source = Column(String(200), nullable=True)  # URL or file origin
    embedding = Column(Vector(384))  # SentenceTransformer dimensions
    is_embedded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Conversation(Base):
    """Stores chat conversation history."""
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationship
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Individual chat messages within a conversation."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)  # tokens used, latency, sources, etc.
    created_at = Column(DateTime, default=utc_now)

    # Relationship
    conversation = relationship("Conversation", back_populates="messages")


class AgentLog(Base):
    """Tracks agent decisions for the monitoring dashboard."""
    __tablename__ = "agent_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String(100), nullable=False, index=True)
    query = Column(Text, nullable=False)
    intent_detected = Column(String(50), nullable=True)  # "search", "chat", "recommend"
    agent_used = Column(String(50), nullable=True)
    nodes_visited = Column(JSON, default=list)  # ["router", "search", "respond"]
    context_retrieved = Column(JSON, default=list)  # doc IDs used
    response_preview = Column(String(500), nullable=True)
    latency_ms = Column(Float, nullable=True)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class SearchLog(Base):
    """Tracks search queries for analytics."""
    __tablename__ = "search_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    query = Column(Text, nullable=False)
    results_count = Column(Integer, default=0)
    top_result_score = Column(Float, nullable=True)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class Organization(Base):
    """Organization/Institution for B2B accounts."""
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    type = Column(String(100), default="B2B Enterprise")
    settings_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="organization")
    orders = relationship("Order", back_populates="organization")
    quotes = relationship("Quote", back_populates="organization")


class User(Base):
    """Platform Users."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(50), default="customer")
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="users")


class Order(Base):
    """Procurement Orders."""
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Processing")
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Line items for an order."""
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("documents.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


class Quote(Base):
    """AI Generated Quotes."""
    __tablename__ = "quotes"

    id = Column(String, primary_key=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    title = Column(String(200), nullable=False)
    total_amount = Column(Float, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    organization = relationship("Organization", back_populates="quotes")

class Review(Base):
    """Product Reviews with Sentiment Analysis."""
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("documents.id"), nullable=False)
    user_email = Column(String(150), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    content = Column(Text, nullable=True)
    sentiment = Column(String(50), nullable=True) # POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score = Column(Float, nullable=True) # Confidence score 0-1
    created_at = Column(DateTime, default=utc_now)

    product = relationship("Document")

class UserInteraction(Base):
    """Tracks user interactions for collaborative filtering."""
    __tablename__ = "user_interactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_email = Column(String(150), nullable=False)
    product_id = Column(String, ForeignKey("documents.id"), nullable=False)
    interaction_type = Column(String(50), nullable=False) # VIEW, CART, PURCHASE
    created_at = Column(DateTime, default=utc_now)

    product = relationship("Document")

