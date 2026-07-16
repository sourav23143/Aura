<div align="center">

# 🧠 Aura AI Hub

### The AI-Powered B2B Procurement Platform for Educational Institutions

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-0.3+-1C3C3C?style=for-the-badge)](https://www.langchain.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-FF6B6B?style=for-the-badge)](https://www.langchain.com/langgraph)
[![Groq](https://img.shields.io/badge/Groq-Llama--3-F55036?style=for-the-badge)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*A production-grade, AI-first B2B SaaS platform purpose-built for schools, colleges, and universities to intelligently discover, plan, and procure educational infrastructure.*

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Technology Stack (Deep Dive)](#-technology-stack-deep-dive)
4. [Database Schema & Data Models](#-database-schema--data-models)
5. [Feature Explanations](#-feature-explanations-with-how-they-work)
6. [API Reference](#-api-reference)
7. [AI/ML Pipeline Deep Dive](#-aiml-pipeline-deep-dive)
8. [Project File Structure](#-project-file-structure)
9. [Local Development Setup](#-local-development-setup)
10. [Environment Variables Reference](#-environment-variables-reference)
11. [Production Deployment Guide](#-production-deployment-guide)
12. [Security Model](#-security-model)

---

## 🎯 Project Overview

**Aura AI Hub** is a modular, production-grade B2B SaaS platform that reimagines how educational institutions procure equipment, software, and infrastructure. Instead of browsing static catalogs, institution administrators interact with multiple specialized AI agents that understand their needs, their budget, and the specific regulatory context of the Indian NEP 2020.

### Key Capabilities

- **Natural-language semantic search** that understands *intent* (not just keywords)
- **An AI Planner** that generates budget-conscious procurement proposals from a plain-English description
- **A real-time AI chatbot** (WebSocket-powered) that acts as a knowledgeable sales engineer, 24/7
- **An Admin Portal** with AI-powered NL2SQL analytics and automated sentiment analysis

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / BROWSER                           │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTPS / WSS
┌─────────────────────▼───────────────────────────────────────┐
│              VERCEL (Frontend CDN)                          │
│  React 18 + Vite SPA                                        │
│  Pages: Home, Search, Planner, Chat, Cart, Admin            │
│  Context: AuthContext, CartContext                          │
└─────────────────────┬───────────────────────────────────────┘
                      │  REST API / WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│              RENDER.COM (Backend)                           │
│  FastAPI + Uvicorn (Python)                                 │
│  ├── LangGraph Multi-Agent Router                           │
│  ├── LangChain RAG Pipeline                                 │
│  ├── Groq LLM (Llama-3.3-70b)                              │
│  └── HuggingFace Transformers (Embeddings + Sentiment)     │
└──────────────┬─────────────────────────────────────────────┘
               │
   ┌───────────┴────────────┐
   │                        │
   ▼                        ▼
SQLite / PostgreSQL      ChromaDB
(Relational Data)      (Vector Store)
(Orders, Users,        (384-dim embeddings
 Reviews, Products)     Cosine Similarity)
```

---

## 🛠️ Technology Stack (Deep Dive)

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Web Framework** | FastAPI | ≥0.115 | REST + WebSocket APIs, OpenAPI docs |
| **Server** | Uvicorn | ≥0.34 | ASGI server for async Python |
| **Production Server** | Gunicorn | ≥21.2 | Production-grade process manager |
| **Settings** | Pydantic Settings | ≥2.7 | Type-safe environment variable loading |
| **ORM** | SQLAlchemy (async) | ≥2.0 | Async database queries |
| **Local DB** | SQLite + aiosqlite | ≥0.20 | Development database |
| **Production DB** | PostgreSQL (Supabase) | — | Cloud-hosted relational database |
| **Vector DB** | ChromaDB | ≥0.5 | On-disk vector similarity store |
| **LLM Orchestration** | LangChain | ≥0.3 | Prompt chains, RAG, memory |
| **Agent Orchestration** | LangGraph | ≥0.2 | Multi-agent state machine |
| **LLM Provider** | Groq (Llama 3.3 70B) | — | Fast LLM inference |
| **Embeddings** | sentence-transformers | ≥3.3 | Local text embeddings (384-dim) |
| **Sentiment Analysis** | HuggingFace Pipeline | — | NLP text classification |
| **Real-time Chat** | WebSockets | ≥14.1 | Bi-directional streaming |
| **Auth** | python-jose + passlib | — | JWT token generation & bcrypt hashing |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18 | Component-based UI |
| **Build Tool** | Vite 8 | Fast bundling & HMR |
| **Routing** | Hash Router | SPA client-side routing |
| **State** | React Context API | Cart and Auth global state |
| **HTTP** | Fetch API | REST API calls |
| **Real-time** | WebSocket API | Chat streaming |

---

## 🗄️ Database Schema & Data Models

### Tables Overview

| Table | Description |
|-------|-------------|
| `documents` | Product catalog with 384-dim vector embeddings |
| `conversations` | Chat session containers per user |
| `messages` | Individual chat messages (user + assistant) |
| `agent_logs` | Telemetry — every agent decision recorded |
| `search_logs` | Search query analytics |
| `organizations` | B2B institutional accounts |
| `users` | Platform users with roles (customer/admin) |
| `orders` | Procurement orders with status tracking |
| `order_items` | Line items within each order |
| `quotes` | AI-generated procurement quotes |
| `reviews` | Product reviews with auto-sentiment labels |
| `user_interactions` | Behavioral data for collaborative filtering |

### Key Model: `Document` (Products)

```python
class Document(Base):
    id            = Column(String, primary_key=True)
    title         = Column(String(500), nullable=False)
    content       = Column(Text, nullable=False)
    category      = Column(String(100), nullable=False)
    subcategory   = Column(String(100), nullable=True)
    tags          = Column(JSON)           # ["STEM", "lab", "science"]
    metadata_json = Column(JSON)           # price, brand, specs, compliance
    embedding     = Column(Vector(384))    # SentenceTransformer vector
    is_embedded   = Column(Boolean, default=False)
    created_at    = Column(DateTime)
```

### Key Model: `Review` (with Sentiment)

```python
class Review(Base):
    id              = Column(String, primary_key=True)
    product_id      = Column(String, ForeignKey("documents.id"))
    user_email      = Column(String(150))
    rating          = Column(Integer)     # 1 to 5 stars
    content         = Column(Text)
    sentiment       = Column(String(50))  # POSITIVE / NEGATIVE / NEUTRAL
    sentiment_score = Column(Float)       # Confidence: 0.0 to 1.0
    created_at      = Column(DateTime)
```

---

## ✨ Feature Explanations (with How They Work)

### 1. Homepage & Navigation

The homepage serves as the primary entry point with:
- **Promotional banner** for B2B deals
- **Hero carousel** cycling through 3 marketing slides
- **Category grid** with visual shortcuts (Smart Classrooms, STEM Robotics, AR/VR Labs, School Software, Science Labs, Library Systems)
- **Featured Products** section

### 2. AI-Powered Semantic Search

**Technical Flow:**
```
User types "interactive teaching tools"
    │
    ▼
HuggingFace all-MiniLM-L6-v2 encodes query → 384-dim vector
    │
    ▼
ChromaDB cosine similarity search → top-5 products
    │
    ▼
Groq LLM generates 2-3 sentence "AI Insight" summary
    │
    ▼
Frontend renders product cards + AI summary
```

Why it's better than keyword search: "interactive panels", "smart boards", and "digital whiteboards" all return the same semantically relevant results.

### 3. AI Setup Planner (Recommendations)

A 3-step wizard:
1. **Requirements Input** — Admin describes needs in plain English
2. **Budget & Priorities** — Max budget + NEP 2020 compliance priorities  
3. **AI Generation** — LLM generates itemized procurement proposal within budget

**How:** Backend fetches 10 relevant products via RAG, then Groq generates a structured JSON proposal with recommended items, quantities, justifications, and cost breakdown.

### 4. AI Sales Consultant (Chatbot)

**WebSocket Architecture:**
```
Frontend opens ws://backend/api/chat/ws/{session_id}
    │
    ├── Receives: {"message": "user query"}
    ├── Runs: LangGraph agent (Router → Search/Chat → Respond)
    ├── Streams: {"type": "token", "content": "word "} (word by word)
    └── Sends: {"type": "done"}
```

**Extra Features:**
- **Autocomplete** — Predicts full questions as user types
- **Suggestions** — Generates 3 follow-up questions after each AI response
- **Memory** — Loads last 10 messages for context-aware conversations

### 5. Shopping Cart & Procurement

- State managed via React Context API + localStorage persistence
- Checkout creates `Order` + `OrderItem` records via REST API

### 6. Admin Dashboard

Secure multi-tab portal:
- **Overview** — Key platform stats
- **Inventory** — Full product CRUD
- **AI Analytics** — NL2SQL query interface  
- **Sentiment & Reviews** — NLP-analyzed review dashboard
- **Order Management** — Full order lifecycle tracking

### 7. AI Analytics (NL2SQL)

```
Admin asks: "Show top 5 products by order volume this month"
    │
    ▼
Groq LLM + DB schema → generates safe SELECT SQL
    │
    ▼
Safety check (no DROP/DELETE/UPDATE allowed)
    │
    ▼
SQLAlchemy executes → results rendered in data table
```

### 8. Sentiment Analysis & Reviews

Every review is automatically classified using a HuggingFace DistilBERT model:
```python
result = pipeline("sentiment-analysis")("Amazing product!")
# → {"label": "POSITIVE", "score": 0.9998}
```
The admin dashboard shows aggregated sentiment distribution (% Positive / Neutral / Negative).

### 9. Authentication & Authorization

```
Registration: Password bcrypt-hashed → stored in DB
Login: Password verified → JWT token generated (HS256)
Protected routes: JWT in Authorization: Bearer header
Admin routes: Additional role check (role == "admin")
```

---

## 📡 API Reference

Full interactive docs: `http://localhost:8000/docs`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |
| POST | `/api/search/` | No | Semantic product search |
| POST | `/api/chat/` | No | REST chat (non-streaming) |
| WS | `/api/chat/ws/{session_id}` | No | WebSocket streaming chat |
| POST | `/api/chat/suggestions` | No | AI follow-up suggestions |
| POST | `/api/chat/autocomplete` | No | Query autocomplete |
| POST | `/api/recommend/` | No | AI Setup Planner |
| GET | `/api/documents/` | No | List all products |
| POST | `/api/documents/` | Admin | Create product |
| PUT | `/api/documents/{id}` | Admin | Update product |
| DELETE | `/api/documents/{id}` | Admin | Delete product |
| GET | `/api/agents/logs` | Admin | Agent telemetry |
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | Login → JWT token |
| GET | `/api/orders/` | Admin | List all orders |
| POST | `/api/orders/` | Yes | Create order |
| POST | `/api/analytics/nl2sql` | Admin | NL to SQL query |
| GET | `/api/reviews/` | Admin | Reviews + sentiment |
| POST | `/api/reviews/` | Yes | Submit review |

---

## 🤖 AI/ML Pipeline Deep Dive

### RAG Pipeline

```python
# 1. Encode user query
query_embedding = embedding_model.encode(query)  # 384-dim

# 2. Vector search in ChromaDB
results = chroma_collection.query(query_embeddings=[query_embedding], n_results=5)

# 3. Build grounded prompt
context = "\n\n".join(results["documents"][0])
prompt = f"Context: {context}\n\nQuestion: {query}"

# 4. LLM generates grounded answer
response = await groq_llm.ainvoke(prompt)
```

### LangGraph Multi-Agent State Machine

```
User Message → Router Node (classifies intent)
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
     Search      Recommend   Chat
     Agent       Agent       Agent
     (ChromaDB   (RAG +      (Conversation
      Semantic)   Proposal)   Memory RAG)
         │          │          │
         └──────────┼──────────┘
                    ▼
              Respond Node → Final answer
```

### NL2SQL Safety

```python
SAFE_KEYWORDS = ["select", "from", "where", "join", "group by", "order by", "limit"]
FORBIDDEN = ["drop", "delete", "update", "insert", "alter", "truncate"]

def validate_sql_safety(sql: str):
    sql_lower = sql.lower()
    for forbidden in FORBIDDEN:
        if forbidden in sql_lower:
            raise ValueError(f"Dangerous SQL keyword detected: {forbidden}")
```

---

## 📁 Project File Structure

```
cortex-ai/
├── backend/
│   ├── app/
│   │   ├── config.py              # Pydantic Settings
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── ai/
│   │   │   ├── agents/graph.py    # LangGraph state machine
│   │   │   ├── agents/nl2sql_agent.py  # NL2SQL agent
│   │   │   ├── embeddings/vectorstore.py  # ChromaDB
│   │   │   ├── rag/pipeline.py    # RAG chain
│   │   │   └── recommendations/engine.py
│   │   ├── api/
│   │   │   ├── auth.py            # JWT auth
│   │   │   ├── orders.py          # Orders CRUD
│   │   │   └── routes/            # All API route handlers
│   │   ├── db/
│   │   │   ├── session.py         # SQLAlchemy engine
│   │   │   ├── seed.py            # Product catalog seeding
│   │   │   └── seed_reviews.py    # Review data seeding
│   │   ├── models/__init__.py     # All ORM models
│   │   └── schemas/__init__.py    # Pydantic schemas
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                       # (not in git)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app + routing
│   │   ├── config.js              # API URL config
│   │   ├── components/            # 30+ reusable components
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                 # Page components
│   │   └── services/api.js        # All API call functions
│   ├── vercel.json                # Vercel SPA config
│   └── package.json
│
├── render.yaml                    # Render.com IaC config
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.10+ |
| Node.js | 18+ |

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```env
APP_ENV=development
DATABASE_URL=sqlite+aiosqlite:///./auraai.db
CORS_ORIGINS=http://localhost:5173
GROQ_API_KEY=gsk_your_key_here
JWT_SECRET=your-random-secret-key
LLM_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

Run backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Run frontend:
```bash
npm run dev
```

**Access at:** http://localhost:5173  
**API Docs at:** http://localhost:8000/docs

---

## 🔐 Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | Groq API key for LLM access |
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens |
| `DATABASE_URL` | No | DB connection (defaults to SQLite) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `LLM_MODEL` | No | Groq model name |
| `EMBEDDING_MODEL` | No | HuggingFace embedding model |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API server URL |

---

## ☁️ Production Deployment Guide

### Backend → Render

1. Push code to GitHub
2. Render.com → **New** → **Blueprint** → Connect repo
3. Render detects `render.yaml` automatically
4. Add secret env vars in Render dashboard: `GROQ_API_KEY`, `DATABASE_URL` (Supabase PostgreSQL URL), `JWT_SECRET`
5. Deploy! Backend live at `https://cortex-ai-backend.onrender.com`

### Frontend → Vercel

1. Vercel.com → **Add New Project** → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL` = your Render backend URL
4. Deploy! Frontend live at `https://cortex-ai-frontend.vercel.app`

### Final Step: Update CORS

In Render dashboard, update `CORS_ORIGINS` to your actual Vercel URL.

### Auto CI/CD

After setup, every `git push origin main` automatically:
- Triggers Vercel to rebuild & redeploy frontend
- Triggers Render to rebuild & redeploy backend

No additional GitHub Actions configuration needed.

---

## 🔒 Security Model

| Concern | Implementation |
|---------|---------------|
| **Password Storage** | bcrypt hashing (passlib) — never stored plain |
| **Authentication** | JWT (HS256), 60-minute expiry |
| **API Security** | Strict CORS whitelist in production |
| **Input Validation** | Pydantic schemas validate all inputs |
| **SQL Injection** | SQLAlchemy ORM parameterized queries |
| **NL2SQL Safety** | SELECT-only validation before execution |
| **Secret Management** | All secrets in env vars, never in source code |

---

<div align="center">

Built with ❤️ for educational institutions everywhere.

**[Report Bug](https://github.com/sourav23143/Aura/issues)** • **[Request Feature](https://github.com/sourav23143/Aura/issues)**

</div>

