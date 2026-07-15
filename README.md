# CortexAI 🧠

A modular, production-grade AI/ML Engineering platform showcasing RAG, LangGraph multi-agent orchestration, semantic search, and streaming chat.

## 🚀 Features
- **Semantic Search:** Fast, embedding-based retrieval with local HuggingFace models.
- **Streaming Chat:** Real-time WebSocket chat that streams LLM tokens.
- **Agent Orchestration:** Uses LangGraph to automatically route intents between search, chat, and recommendation agents.
- **Smart Recommendations:** Blended scoring (vector similarity + metadata) for accurate product/content recommendations.
- **Agent Dashboard:** Live telemetry and intent tracing of the AI agents.

---

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python), SQLAlchemy, SQLite
- **AI/ML:** LangChain, LangGraph, ChromaDB, Groq (Llama-3), sentence-transformers
- **Frontend:** React, Vite, Custom CSS (Glassmorphism & Dark Mode)

---

## 🏃 How to Run Locally (Step-by-Step)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API Key](https://console.groq.com/keys) (Free)

### 2. Setup the Backend (FastAPI + AI)
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd cortex-ai/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder and add your Groq API Key:
   ```env
   GROQ_API_KEY="your_api_key_here"
   ```
5. Run the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will automatically seed the vector database on the first run.*

### 3. Setup the Frontend (React + Vite)
1. Open a **new** terminal window and navigate to the `frontend` folder:
   ```bash
   cd cortex-ai/frontend
   ```
2. Install the npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. See the Project!
- Open your browser and go to: **[http://localhost:5173](http://localhost:5173)**
- You can navigate through the Search, Chat, Recommend, and Monitor tabs!
- *Backend API Docs:* [http://localhost:8000/docs](http://localhost:8000/docs)
