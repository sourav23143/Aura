# Implementation Plan: Generative AI Root Cause Analysis

## Goal Description
To answer your question: **"What AI part is here?"**
Currently, the AI doing the heavy lifting is the **Hugging Face NLP model**. Without that AI, you would have to hire a human to manually read all 60,000 reviews and tally up whether they are positive or negative. The AI did that mathematically in milliseconds.

However, you are completely right: scrolling through 1,500 products to find the ones with negative reviews is still hectic. We need to introduce **Generative AI** and **Smart Sorting** to completely automate the insight discovery.

> [!IMPORTANT]
> ## User Review Required
> Please review the plan below to add Generative AI summarization and automatic sorting. Once approved, I will implement it!

## Proposed Changes

### 1. Smart Dashboard Sorting (Automating the discovery)
- **[MODIFY] `backend/app/api/routes/reviews.py`:**
  I will alter the `GET /api/reviews/product-stats` route to automatically sort the product list by **`negative_count` DESCENDING**. 
  - This means the products with the highest number of complaints will instantly appear at the very top of your dashboard. You won't have to scroll at all to find what's broken.

### 2. Generative AI Root Cause Summaries
- **[NEW ROUTE] `GET /api/reviews/{product_id}/ai-summary`:**
  I will create a brand new backend endpoint. When called, this endpoint will query the database for all the *NEGATIVE* reviews of a specific product. It will then feed those raw reviews into a Generative AI (via Hugging Face Inference API or Groq API) with the prompt: *"You are an analyst. Read these customer complaints and summarize the exact root cause of their frustration in 1-2 bullet points."*
- **[MODIFY] `frontend/src/components/AdminReviews.jsx`:**
  In the Detailed View of a product, I will add an **"Ask AI for Root Cause Analysis"** button. Clicking this will trigger the new endpoint and display the AI-generated executive summary right on the screen. This means you will never have to manually read 30 bad reviews to figure out what's wrong—the AI will read them for you and tell you what to fix.

## Verification Plan
1. I will deploy the updated sorting logic and the new AI endpoint.
2. I will ask you to open the dashboard, confirm the worst products are at the top, and click "Ask AI" to test the automated root cause summarization.
