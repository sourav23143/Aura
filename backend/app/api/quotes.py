from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models import Quote, User
from app.api.auth import get_current_user

router = APIRouter(prefix="/quotes", tags=["quotes"])

class QuoteCreate(BaseModel):
    title: str
    total_amount: float

@router.post("/generate")
async def generate_quote(quote_in: QuoteCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
    
    expires = datetime.utcnow() + timedelta(days=30)
    
    quote = Quote(
        organization_id=current_user.organization_id,
        title=quote_in.title,
        total_amount=quote_in.total_amount,
        expires_at=expires
    )
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    return {"success": True, "quote_id": quote.id}

@router.get("/list")
async def list_quotes(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        return []
    
    result = await db.execute(
        select(Quote).where(Quote.organization_id == current_user.organization_id).order_by(Quote.created_at.desc())
    )
    quotes = result.scalars().all()
    
    return [
        {
            "id": q.id,
            "title": q.title,
            "total_amount": q.total_amount,
            "expires_at": q.expires_at,
            "created_at": q.created_at
        } for q in quotes
    ]
