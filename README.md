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

<br/>

### 🌍 Live Application Links

**🚀 Frontend (Live App):** [https://aura-ten-sooty.vercel.app/](https://aura-ten-sooty.vercel.app/)  
**⚙️ Backend API:** [https://cortex-ai-backend-ia83.onrender.com/docs](https://cortex-ai-backend-ia83.onrender.com/docs)  
**🗄️ Database:** Hosted on Supabase (PostgreSQL)

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
- **Fully Responsive Design** that works seamlessly across desktop, tablet, and mobile devices

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
Supabase PostgreSQL      ChromaDB
(Relational Data)      (Vector Store)
(Orders, Users,        (384-dim embeddings
 Reviews, Products)     Cosine Similarity)
```

---

## 📸 Application Screenshots

> All screenshots were captured live from the running application.

### 🏠 Homepage — Hero Section
![Homepage Hero](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/01_homepage_hero.png)

### 📂 Homepage — Category Navigation
![Homepage Categories](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/02_homepage_categories.png)

### 🛍️ Homepage — Featured Products
![Homepage Featured](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/03_homepage_featured.png)

### 🔍 Semantic Search — Results Page
![Search Results](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/04_search_results.png)

### 🤖 AI Setup Planner — Step 1 (Requirements)
![AI Planner Step 1](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/06_ai_planner_step1.png)

### 📋 AI Setup Planner — Generated Proposal
![AI Proposal](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/08_ai_planner_proposal.png)

### 💬 AI Sales Consultant — Chatbot Interface
![Chatbot Page](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/10_chatbot_page.png)

### 🛒 Shopping Cart
![Cart Page](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/12_cart_page.png)

### 🔐 Admin Dashboard — Overview
![Admin Dashboard](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/13_admin_dashboard.png)

### 📊 Admin Dashboard — AI Analytics (NL2SQL)
![Admin Analytics](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/15_admin_analytics.png)

### 📖 API Endpoints Overview
![API Endpoints](https://raw.githubusercontent.com/sourav23143/Aura/main/docs/screenshots/19_api_docs_endpoints.png)

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
| **Styling** | Vanilla CSS | Custom responsive design system |

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

---

## ✨ Feature Explanations (with How They Work)

### 1. Homepage & Navigation

The homepage serves as the primary entry point with:
- **Promotional banner** for B2B deals
- **Hero carousel** cycling through marketing slides
- **Category grid** with visual shortcuts (Smart Classrooms, STEM Robotics, AR/VR Labs, School Software, Science Labs, Library Systems)
- **Fully Responsive Navigation** including a mobile hamburger menu

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

### 3. AI Setup Planner (Recommendations)

A 3-step wizard:
1. **Requirements Input** — Admin describes needs in plain English
2. **Budget & Priorities** — Max budget + compliance priorities  
3. **AI Generation** — LLM generates itemized procurement proposal within budget

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

### 5. Admin Dashboard

Secure multi-tab portal:
- **Overview** — Key platform stats
- **Inventory** — Full product CRUD
- **AI Analytics** — NL2SQL query interface (translates English to safe SQL)
- **Sentiment & Reviews** — NLP-analyzed review dashboard using HuggingFace DistilBERT
- **Order Management** — Full order lifecycle tracking

---

## 📡 API Reference

Full interactive docs: `https://cortex-ai-backend-ia83.onrender.com/docs`

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
| GET | `/api/orders/` | Admin | List all orders |
| POST | `/api/analytics/nl2sql` | Admin | NL to SQL query |
| GET | `/api/reviews/` | Admin | Reviews + sentiment |

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

---

## ☁️ Production Deployment Architecture

The application is deployed via continuous integration to **Vercel** (Frontend) and **Render** (Backend), with data securely stored on **Supabase** (PostgreSQL).

- **Frontend (Vercel):** Connected directly to the main branch. Any push triggers a new production build of the Vite React application. Environment variables (`VITE_API_URL`) handle routing to the backend.
- **Backend (Render):** Connected to the main branch. Any push triggers a Docker/Python build pipeline. Uvicorn serves the FastAPI endpoints, which connect to Supabase.
- **Database (Supabase):** Securely hosted PostgreSQL instance containing users, orders, and products.

---

## 🔒 Security Model

| Concern | Implementation |
|---------|---------------|
| **Password Storage** | bcrypt hashing (passlib) — never stored plain |
| **Authentication** | JWT (HS256), 60-minute expiry |
| **API Security** | Strict CORS whitelist in production connecting Vercel and Render |
| **Input Validation** | Pydantic schemas validate all inputs |
| **SQL Injection** | SQLAlchemy ORM parameterized queries |
| **NL2SQL Safety** | SELECT-only validation before execution |
| **Secret Management** | All API keys and DB URLs in secure environment variables |

---

<div align="center">

**[Report Bug](https://github.com/sourav23143/Aura/issues)** • **[Request Feature](https://github.com/sourav23143/Aura/issues)**

</div>
 
 