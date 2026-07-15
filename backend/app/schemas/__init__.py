"""
CortexAI — Pydantic Schemas
Request/response schemas for all API endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ─── Document Schemas ─────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: Optional[str] = None
    tags: list[str] = []
    metadata_json: dict = {}
    source: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    subcategory: Optional[str]
    tags: list[str]
    metadata_json: dict
    source: Optional[str]
    is_embedded: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentList(BaseModel):
    documents: list[DocumentResponse]
    total: int


# ─── Search Schemas ───────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    category: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)
    use_ai_summary: bool = True


class SearchResult(BaseModel):
    id: str
    title: str
    content: str
    category: str
    score: float = Field(..., description="Similarity score 0-1")
    metadata_json: dict = {}


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    ai_summary: Optional[str] = None
    total_results: int
    latency_ms: float


# ─── Chat Schemas ─────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    stream: bool = True


class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: list[dict] = []
    agent_used: Optional[str] = None
    latency_ms: float


# ─── Recommendation Schemas ───────────────────────────────

class RecommendationProfile(BaseModel):
    """User profile for generating recommendations."""
    description: str = Field(..., min_length=10, max_length=2000,
                             description="Describe what you're looking for")
    category: Optional[str] = None
    budget_range: Optional[str] = None  # "low", "medium", "high"
    priorities: list[str] = []  # ["quality", "affordability", "innovation"]
    top_k: int = Field(default=5, ge=1, le=10)


class RecommendationItem(BaseModel):
    id: str
    title: str
    content: str
    category: str
    relevance_score: float
    reasoning: str  # AI-generated explanation


class RecommendationResponse(BaseModel):
    profile_summary: str
    recommendations: list[RecommendationItem]
    ai_insights: str  # Overall AI analysis
    latency_ms: float


# ─── Agent Monitoring Schemas ─────────────────────────────

class AgentLogResponse(BaseModel):
    id: str
    session_id: str
    query: str
    intent_detected: Optional[str]
    agent_used: Optional[str]
    nodes_visited: list[str]
    response_preview: Optional[str]
    latency_ms: Optional[float]
    token_count: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class AgentMonitorResponse(BaseModel):
    logs: list[AgentLogResponse]
    total: int
    avg_latency_ms: float
    intent_distribution: dict[str, int]


# ─── Health Check ─────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    groq_connected: bool
    chroma_connected: bool
    db_connected: bool
