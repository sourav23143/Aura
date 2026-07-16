import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import engine, async_session_factory
from app.models import User
import bcrypt

async def create_admin():
    async with async_session_factory() as session:
        email = "admin@auraai.com"
        password = "adminpassword123"
        
        # Use native bcrypt
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Check if exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"User {email} already exists.")
            return
            
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name="System Admin",
            role="admin"
        )
        session.add(admin_user)
        await session.commit()
        print(f"Created admin user: {email} / {password}")

if __name__ == "__main__":
    asyncio.run(create_admin())
