"""
Standalone script to seed comprehensive demo reviews.
Run: python scripts/seed_reviews.py [--force]
"""
import asyncio
import selectors
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, async_session_factory
from app.db.seed_reviews import seed_demo_reviews
from app.models import Review
from sqlalchemy import select, func, delete


async def main():
    print("Connecting to Supabase PostgreSQL...")
    await init_db()

    async with async_session_factory() as session:
        result = await session.execute(select(func.count(Review.id)))
        count = result.scalar()
        print(f"Current review count: {count}")

        if "--force" in sys.argv:
            print("Force flag detected, deleting existing reviews...")
            await session.execute(delete(Review))
            await session.commit()
            print("Deleted all existing reviews.")

        result = await seed_demo_reviews(session)
        if result["newly_added"] > 0:
            print(f"[OK] Seeded {result['newly_added']} reviews across all products!")
        else:
            print(f"[INFO] Reviews already exist ({result['review_count']} in DB).")
            print("   Use --force to delete and re-seed.")


if __name__ == "__main__":
    selector = selectors.SelectSelector()
    loop = asyncio.SelectorEventLoop(selector)
    asyncio.run(main(), loop_factory=lambda: loop)
