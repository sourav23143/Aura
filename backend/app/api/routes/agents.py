"""
CortexAI — Agent Monitoring API Route
Provides visibility into agent decisions for the monitoring dashboard.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.schemas import AgentLogResponse, AgentMonitorResponse
from app.models import AgentLog
from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agent Monitoring"])


@router.get("/logs", response_model=AgentMonitorResponse)
async def get_agent_logs(
    limit: int = 50,
    session_id: str = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get agent activity logs for the monitoring dashboard.
    Shows which agents were used, latency, intent distribution, etc.
    """
    query = select(AgentLog).order_by(AgentLog.created_at.desc()).limit(limit)
    if session_id:
        query = query.where(AgentLog.session_id == session_id)

    result = await db.execute(query)
    logs = result.scalars().all()

    # Calculate stats
    avg_latency = 0
    intent_dist = {}

    if logs:
        latencies = [l.latency_ms for l in logs if l.latency_ms]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        for log in logs:
            intent = log.intent_detected or "unknown"
            intent_dist[intent] = intent_dist.get(intent, 0) + 1

    return AgentMonitorResponse(
        logs=[AgentLogResponse.model_validate(l) for l in logs],
        total=len(logs),
        avg_latency_ms=round(avg_latency, 2),
        intent_distribution=intent_dist,
    )


@router.get("/stats")
async def get_agent_stats(db: AsyncSession = Depends(get_db)):
    """
    Get aggregate agent statistics.
    """
    # Total queries processed
    total_result = await db.execute(select(func.count(AgentLog.id)))
    total_queries = total_result.scalar()

    # Average latency
    avg_result = await db.execute(select(func.avg(AgentLog.latency_ms)))
    avg_latency = avg_result.scalar() or 0

    # Intent distribution
    intent_result = await db.execute(
        select(AgentLog.intent_detected, func.count(AgentLog.id))
        .group_by(AgentLog.intent_detected)
    )
    intent_distribution = {row[0] or "unknown": row[1] for row in intent_result.all()}

    # Recent queries
    recent_result = await db.execute(
        select(AgentLog).order_by(AgentLog.created_at.desc()).limit(5)
    )
    recent = recent_result.scalars().all()

    return {
        "total_queries": total_queries,
        "avg_latency_ms": round(float(avg_latency), 2),
        "intent_distribution": intent_distribution,
        "recent_queries": [
            {
                "query": l.query[:100],
                "intent": l.intent_detected,
                "latency_ms": l.latency_ms,
            }
            for l in recent
        ],
    }
