# Aura AI: Complete Exhaustive Testing Guide

Welcome to the ultimate testing manual for the **Aura AI Hub**. This guide has been expanded to cover *every single feature*, edge case, and system in your application.

Crucially, this guide explains the **Deep Tech Concepts** operating behind the scenes, so you fully understand the enterprise-grade AI architecture you have built.

---

## 1. Customer Registration & Authentication (B2B/B2C)

### 🧠 The Concept
Aura AI uses **JWT (JSON Web Tokens)** and **bcrypt password hashing**. Instead of storing raw passwords, your PostgreSQL database stores a mathematically scrambled hash. The backend issues a cryptographically signed JWT token that the React frontend stores in LocalStorage to prove identity on subsequent requests.

### 🧪 How to Test It
1. Open your React Frontend (`http://localhost:5173/`).
2. Click the **Account** icon in the header and select **Customer Sign In**.
3. Under the login form, click **Register here**.
4. Create a new user (e.g., `testuser@school.edu`, Password: `password123`, Name: `Test`, Org: `School`).
5. **What to Observe:** The system will create the user in PostgreSQL, return a JWT, automatically log you in, and redirect you. 

---

## 2. Secure Admin Entry Points & Command Center

### 🧠 The Concept
Instead of mixing administrators and normal shoppers on the same login page (which causes confusion and security risks), we have built dedicated, discreet pathways for enterprise staff to access the Command Center. The Admin Dashboard is protected by a Role-Based Access Control (RBAC) middleware in FastAPI.

### 🧪 How to Test It
1. **The Stealth Footer:** Scroll to the absolute bottom of the storefront page. Under "Get to Know Us", click `Employee Login`. 
2. **The Account Dropdown:** Hover over the `Account` icon and click the red `Admin Portal` option.
3. **The Form Toggle:** On the customer login page, click `Are you an administrator? Log in here.` at the bottom.
4. **What to Observe:** All three actions will securely transport you into the sleek `Admin Portal Login` UI. Login with `admin@auraai.com` / `adminpassword123` to see the new SaaS-style Command Center.

---

## 3. Semantic Product Search (Vector AI)

### 🧠 The Concept
Traditional search engines use "keyword matching". Aura AI uses **Semantic Search**. 
- Using a Hugging Face `Sentence-Transformer` AI model, product descriptions are converted into **384-dimensional mathematical arrays (Vectors)**.
- These vectors are stored in **PostgreSQL using the `pgvector` extension**. 
- When you type a search, the database calculates the spatial "distance" between your query and all products to find the closest conceptual match!

### 🧪 How to Test It
1. Go to the main Storefront.
2. In the search bar, type something abstract: `"how to teach students about space and gravity"`.
3. **What to Observe:** The AI understands the *meaning* (physics/science education) and returns items like the **Virtual Reality (VR) Physics Simulator**, even if the words "teach students about space" aren't explicitly in the product title! 

---

## 4. E-commerce Cart & Checkout Flow

### 🧠 The Concept
The cart state is managed globally in React using the Context API (`CartContext`), ensuring that adding an item from a product page instantly updates the little red notification bubble on the Cart icon in the header.

### 🧪 How to Test It
1. Browse the store and click **Add to Cart** on 2-3 different products.
2. Observe the red bubble on the Cart icon increment.
3. Click the **Cart** icon.
4. **What to Observe:** The cart page will list your items and calculate the total. Click **Place Order**. It will clear your cart and send a secure POST request to the backend to create an `Order` record in PostgreSQL.

---

## 5. B2B Consultant Chatbot (LangGraph + RAG)

### 🧠 The Concept
This is a **Multi-Agent RAG (Retrieval-Augmented Generation)** system built on **LangGraph**.
- **LangGraph** analyzes your message and decides: *Is this a casual greeting? Or do they need to find a product?*
- If you need a product, it triggers the **RAG Pipeline**, fetches exact vectors from `pgvector`, and injects them into the prompt for **Llama-3 (via Groq)**.

### 🧪 How to Test It
1. Open the Chat Widget in the bottom right corner.
2. Type: `"I am setting up a new office for 5 developers. What monitors do you recommend?"`
3. **What to Observe:** The bot streams the answer in real-time, recommending actual products from your database.

---

## 6. Hybrid Recommendation Engine

### 🧠 The Concept
Recommendation algorithms usually fall into two camps: Content-based or Collaborative Filtering. Aura AI uses a **Blended Hybrid Engine**. It combines semantic vector scores with an Engagement Multiplier (how many clicks/purchases a product has).

### 🧪 How to Test It
1. Go to the **Recommendations** (Planner) page.
2. Fill out a profile: `"I need an ergonomic setup to fix my back posture."` 
3. **What to Observe:** The engine will score chairs and desks.
4. **Test the Hybrid Loop:** Click "Add to Cart" on a recommended chair. This fires an interaction event. If you request recommendations again, that chair's overall score receives an "Engagement Boost".

---

## 7. Automated Sentiment Analysis (NLP)

### 🧠 The Concept
Aura AI runs a local **Natural Language Processing (NLP) pipeline** using the Hugging Face `distilbert-base-uncased-finetuned-sst-2-english` model. As soon as a review is submitted, this AI classifies it as `POSITIVE` or `NEGATIVE` in milliseconds.

### 🧪 How to Test It
1. Go to any product page and leave a review. 
2. Write something highly negative: `"This product arrived completely broken! I demand a refund."`
3. Log in to the **Admin Dashboard** and click the **Sentiment & Reviews** tab.
4. **What to Observe:** The system automatically tagged your review with a red `NEGATIVE` badge.

---

## 8. NL2SQL Analytics Engine (Chat with your Database)

### 🧠 The Concept
Aura AI features an **NL2SQL (Natural Language to SQL)** agent. It feeds your PostgreSQL schema to Llama-3. When you ask a question in English, Llama-3 writes a valid SQL query, executes it securely in read-only mode, and translates the data back into plain English!

### 🧪 How to Test It
1. Go to the **Admin Dashboard** and open the **AI Analytics (NL2SQL)** tab.
2. Ask: `"How many products do we currently have in the database?"`
3. **What to Observe:** The AI will instantly query the live PostgreSQL tables and give you a data-driven answer.

---

## 9. Admin Inventory & Order Management (CRUD)

### 🧠 The Concept
Standard CRUD (Create, Read, Update, Delete) operations powered by SQLAlchemy Async ORM. This allows admins to manage the actual physical inventory and dispatch orders without directly modifying the database.

### 🧪 How to Test It
1. In the **Admin Dashboard**, go to **Inventory Management**.
2. Click **Add New Item**, fill out details, and save. Verify it appears on the storefront immediately!
3. Go to **Order Management**. You will see the order you placed during the Checkout test (Step 4). Change its status from `pending` to `shipped`.

---

> [!TIP]
> **Pro Tip for Testing:** Have the backend terminal window visible on your secondary monitor while testing the frontend. You will be able to see FastAPI routing the requests, the SQL queries executing, and the AI models processing your prompts in real-time!
