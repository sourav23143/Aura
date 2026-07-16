from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models import Order, OrderItem, User
from app.api.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    total_amount: float

@router.post("/checkout")
async def checkout(order_in: OrderCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization to checkout")
    
    # Create the Order
    order = Order(
        organization_id=current_user.organization_id,
        total_amount=order_in.total_amount,
        status="Confirmed"
    )
    db.add(order)
    await db.flush()  # to get order.id

    from app.models import Document
    from sqlalchemy.orm.attributes import flag_modified

    # Create the Order Items and decrement inventory
    for item in order_in.items:
        # Check and decrement stock
        product_res = await db.execute(select(Document).where(Document.id == item.product_id))
        product = product_res.scalar_one_or_none()
        if product:
            meta = dict(product.metadata_json or {})
            current_qty = meta.get("inventory_qty", 10)  # default to 10 if not set
            if current_qty < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for product '{product.title}'. Only {current_qty} left."
                )
            meta["inventory_qty"] = current_qty - item.quantity
            product.metadata_json = meta
            flag_modified(product, "metadata_json")
            db.add(product)

        db_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price
        )
        db.add(db_item)
    
    await db.commit()
    await db.refresh(order)
    return {"success": True, "order_id": order.id, "status": order.status}

@router.get("/history")
async def get_order_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        return []
    
    # Fetch orders for this organization
    result = await db.execute(
        select(Order).where(Order.organization_id == current_user.organization_id).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at
        } for o in orders
    ]

@router.get("/all")
async def get_all_orders(db: AsyncSession = Depends(get_db)):
    """Fetch all orders for the admin dashboard."""
    result = await db.execute(
        select(Order).options(selectinload(Order.organization)).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "organization_name": o.organization.name if o.organization else "Unknown",
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at
        } for o in orders
    ]

class StatusUpdate(BaseModel):
    status: str

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, status_update: StatusUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    db.add(order)
    await db.commit()
    return {"success": True, "status": order.status}
