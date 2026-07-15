import asyncio
import shutil
from pathlib import Path
from app.db.session import engine, Base, async_session_factory
from app.db.seed import seed_documents

async def reset_database():
    print("Dropping all SQLite tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    print("Deleting ChromaDB Vector Store...")
    chroma_path = Path(__file__).parent / "chroma_db"
    if chroma_path.exists():
        try:
            shutil.rmtree(chroma_path)
            print("ChromaDB deleted.")
        except Exception as e:
            print(f"Could not delete chroma_db (might be locked by uvicorn): {e}")
            print("Trying to continue anyway...")
    
    print("Re-seeding database from documents.json...")
    async with async_session_factory() as session:
        result = await seed_documents(session)
        print(f"Seeding Complete: {result}")

if __name__ == "__main__":
    asyncio.run(reset_database())
