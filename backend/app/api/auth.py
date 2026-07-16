from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.models import User, Organization
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "super-secret-key-for-demo-purposes-only-do-not-use-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password, hashed_password):
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_password, hashed_password)
    except ValueError:
        return False

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Organization first
    org = Organization(name=user_in.organization_name)
    db.add(org)
    await db.commit()
    await db.refresh(org)

    # Create User
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        organization_id=org.id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # fetch organization as well
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalars().first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "organization": {
            "id": org.id,
            "name": org.name,
            "type": org.type,
            "settings": org.settings_json
        } if org else None
    }

class SettingsUpdate(BaseModel):
    settings: dict

@router.put("/settings")
async def update_settings(settings_in: SettingsUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization linked")
    
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalars().first()
    org.settings_json = settings_in.settings
    await db.commit()
    return {"success": True}

class ProfileUpdate(BaseModel):
    full_name: str
    organization_name: str
    organization_type: str

@router.put("/profile")
async def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user.full_name = profile_in.full_name
    
    if current_user.organization_id:
        result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        org = result.scalars().first()
        if org:
            org.name = profile_in.organization_name
            org.type = profile_in.organization_type
            
    await db.commit()
    return {"success": True}

@router.delete("/me")
async def delete_user_account(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = current_user.organization_id
    await db.delete(current_user)
    await db.flush() # Delete user first to avoid FK constraint violations
    
    if org_id:
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalars().first()
        if org:
            from sqlalchemy import delete
            from app.models import Quote, Order, OrderItem
            
            await db.execute(delete(Quote).where(Quote.organization_id == org_id))
            
            orders_res = await db.execute(select(Order.id).where(Order.organization_id == org_id))
            order_ids = [row[0] for row in orders_res.all()]
            if order_ids:
                await db.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
                await db.execute(delete(Order).where(Order.organization_id == org_id))
                
            await db.delete(org)
            
    await db.commit()
    return {"success": True}
