import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import text
from app.db.session import engine

async def fix_rls():
    print("Fixing RLS warnings...")
    async with engine.begin() as conn:
        # Get all tables in the public schema
        result = await conn.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public';
        """))
        tables = result.scalars().all()
        
        for table in tables:
            print(f"Enabling Row Level Security for table: {table}")
            await conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
            
    print("All security warnings fixed!")

if __name__ == "__main__":
    asyncio.run(fix_rls())
