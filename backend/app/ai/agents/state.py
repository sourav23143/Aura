"""
AuraAI — Agent State Definition
TypedDict that defines the shared state flowing through the LangGraph agent graph.
Every node reads from and writes to this state.
"""

from typing import TypedDict, Optional, Annotated
from operator import add


class AgentState(TypedDict):
    """
    Shared state for the multi-agent LangGraph workflow.

    Flow: query → router → [search|chat|recommend] → respond
    """

    # Input
    query: str                          # Original user query
    session_id: str                     # Session identifier for memory
    chat_history: list[dict]            # Previous conversation messages

    # Router output
    intent: str                         # "search", "chat", or "recommend"

    # Agent processing
    retrieved_docs: list[dict]          # Documents retrieved from vector store
    agent_response: str                 # Generated response from the agent

    # Recommendation-specific
    recommendation_profile: Optional[dict]  # User profile for recommendations
    recommendations: list[dict]         # Generated recommendations

    # Metadata / monitoring
    nodes_visited: Annotated[list[str], add]  # Track which nodes were visited
    latency_ms: float                   # Total processing time
    token_count: int                    # Estimated tokens used
    error: Optional[str]               # Error message if something failed
