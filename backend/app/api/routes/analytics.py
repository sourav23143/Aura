from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.ai.agents.nl2sql_agent import generate_and_execute_sql

router = APIRouter(prefix="/analytics", tags=["analytics"])

class AnalyticsQuery(BaseModel):
    question: str

@router.post("/query")
async def ask_analytics_question(query: AnalyticsQuery):
    """Process a natural language question into SQL and return data."""
    result = await generate_and_execute_sql(query.question)
    return result
