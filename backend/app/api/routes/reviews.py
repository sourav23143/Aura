import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, Float

from app.db.session import get_db, async_session_factory
from app.models import Review, Document
from app.config import get_settings
from app.schemas import ReviewCreate, ReviewResponse
from app.ai.llm.provider import get_llm

router = APIRouter(prefix="/reviews", tags=["reviews"])
settings = get_settings()

async def analyze_sentiment_hf(text: str) -> dict:
    """Uses Hugging Face Inference API for sentiment analysis."""
    if not text or not settings.huggingface_api_key:
        return None
        
    API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
    headers = {"Authorization": f"Bearer {settings.huggingface_api_key}"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(API_URL, headers=headers, json={"inputs": text})
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    predictions = result[0]
                    best_pred = max(predictions, key=lambda x: x['score'])
                    return {"sentiment": best_pred['label'], "score": best_pred['score']}
    except Exception as e:
        print(f"HuggingFace API unavailable: {e}")
    return None

async def analyze_sentiment_groq(text: str) -> dict:
    """Uses Groq LLM as fallback for sentiment analysis."""
    try:
        llm = get_llm()
        prompt = (
            f"Classify the sentiment of the following text as exactly one of: POSITIVE, NEGATIVE, or NEUTRAL.\n"
            f"Respond with ONLY the single word (POSITIVE, NEGATIVE, or NEUTRAL) and nothing else.\n\n"
            f"Text: \"{text}\""
        )
        response = llm.invoke(prompt)
        label = response.content.strip().upper()
        if label in ("POSITIVE", "NEGATIVE", "NEUTRAL"):
            score = 0.9 if label != "NEUTRAL" else 0.5
            return {"sentiment": label, "score": score}
    except Exception as e:
        print(f"Groq sentiment fallback failed: {e}")
    return None

def analyze_sentiment_keywords(text: str) -> dict:
    """Keyword-based fallback for offline sentiment analysis."""
    text_lower = text.lower()
    negative_words = ["broken", "terrible", "awful", "refund", "demand", "worst", "horrible",
                      "disappointing", "failed", "useless", "waste", "damaged", "never", "poor"]
    positive_words = ["great", "excellent", "amazing", "love", "perfect", "fantastic", "wonderful",
                      "recommend", "best", "awesome", "happy", "good", "satisfied", "outstanding"]
    
    neg_count = sum(1 for w in negative_words if w in text_lower)
    pos_count = sum(1 for w in positive_words if w in text_lower)
    
    if neg_count > pos_count:
        return {"sentiment": "NEGATIVE", "score": min(0.5 + neg_count * 0.1, 0.95)}
    elif pos_count > neg_count:
        return {"sentiment": "POSITIVE", "score": min(0.5 + pos_count * 0.1, 0.95)}
    return {"sentiment": "NEUTRAL", "score": 0.5}

async def analyze_sentiment(text: str) -> dict:
    """Main sentiment analysis with multi-tier fallback."""
    if not text:
        return {"sentiment": "NEUTRAL", "score": 0.5}
    
    # Tier 1: HuggingFace API
    result = await analyze_sentiment_hf(text)
    if result:
        return result
    
    # Tier 2: Groq LLM
    result = await analyze_sentiment_groq(text)
    if result:
        return result
    
    # Tier 3: Keyword matching
    return analyze_sentiment_keywords(text)


async def process_sentiment_bg(review_id: str, content: str):
    """Background task to run sentiment analysis."""
    async with async_session_factory() as db:
        sentiment_data = await analyze_sentiment(content)
        result = await db.execute(select(Review).where(Review.id == review_id))
        review = result.scalar_one_or_none()
        if review:
            review.sentiment = sentiment_data["sentiment"]
            review.sentiment_score = sentiment_data["score"]
            await db.commit()

@router.post("/", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Creates a review and delegates sentiment analysis to background."""
    # Check if product exists
    doc = await db.execute(select(Document).where(Document.id == review.product_id))
    if not doc.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_review = Review(
        product_id=review.product_id,
        user_email=review.user_email,
        rating=review.rating,
        content=review.content,
        sentiment="PENDING",
        sentiment_score=0.0
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    background_tasks.add_task(process_sentiment_bg, new_review.id, new_review.content)
    
    return new_review

@router.delete("/{review_id}")
async def delete_review(review_id: str, user_email: str, db: AsyncSession = Depends(get_db)):
    """Deletes a review if the user owns it."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.user_email != user_email:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        
    await db.delete(review)
    await db.commit()
    return {"message": "Review deleted"}

@router.get("/product-stats")
async def get_product_sentiment_stats(db: AsyncSession = Depends(get_db)):
    """Gets aggregated sentiment stats per product."""
    query = (
        select(
            Document.id,
            Document.title,
            Document.category,
            func.count(Review.id).label("total_reviews"),
            func.sum(case((Review.sentiment == 'POSITIVE', 1), else_=0)).label("positive_count"),
            func.sum(case((Review.sentiment == 'NEGATIVE', 1), else_=0)).label("negative_count"),
            func.sum(case((Review.sentiment == 'NEUTRAL', 1), else_=0)).label("neutral_count"),
            func.avg(Review.sentiment_score).label("avg_confidence"),
            func.avg(Review.rating).label("avg_rating"),
        )
        .join(Review, Document.id == Review.product_id)
        .group_by(Document.id, Document.title, Document.category)
        .order_by(func.sum(case((Review.sentiment == 'NEGATIVE', 1), else_=0)).desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "product_id": row.id,
            "product_title": row.title,
            "category": row.category,
            "total_reviews": row.total_reviews,
            "positive_count": row.positive_count or 0,
            "negative_count": row.negative_count or 0,
            "neutral_count": row.neutral_count or 0,
            "avg_confidence": round(float(row.avg_confidence or 0), 2),
            "avg_rating": round(float(row.avg_rating or 0), 1),
        }
        for row in rows
    ]

@router.get("/analytics/global")
async def get_global_sentiment_analytics(db: AsyncSession = Depends(get_db)):
    """
    Advanced global analytics — sentiment distribution, confidence histogram,
    category breakdown, and flagged products.
    Demonstrates real NLP pipeline analytics over 80K+ reviews.
    """
    # 1. Global sentiment distribution
    dist_query = select(
        Review.sentiment,
        func.count(Review.id).label("count"),
        func.avg(Review.sentiment_score).label("avg_score"),
    ).group_by(Review.sentiment)
    dist_result = await db.execute(dist_query)
    sentiment_distribution = {
        row.sentiment: {"count": row.count, "avg_score": round(float(row.avg_score or 0), 3)}
        for row in dist_result.all()
    }

    # 2. Confidence score histogram (10 buckets) — using raw SQL for PostgreSQL compatibility
    from sqlalchemy import text as sa_text
    conf_result = await db.execute(sa_text("""
        SELECT LEAST(FLOOR(sentiment_score * 10)::int, 9) AS bucket, COUNT(*) AS count
        FROM reviews
        GROUP BY LEAST(FLOOR(sentiment_score * 10)::int, 9)
        ORDER BY bucket
    """))
    confidence_histogram = [0] * 10
    for row in conf_result.all():
        bucket_idx = int(row[0]) if row[0] is not None else 0
        confidence_histogram[bucket_idx] = int(row[1])

    # 3. Sentiment by product category
    cat_query = (
        select(
            Document.category,
            func.count(Review.id).label("total"),
            func.sum(case((Review.sentiment == 'POSITIVE', 1), else_=0)).label("positive"),
            func.sum(case((Review.sentiment == 'NEGATIVE', 1), else_=0)).label("negative"),
            func.sum(case((Review.sentiment == 'NEUTRAL', 1), else_=0)).label("neutral"),
            func.avg(Review.rating).label("avg_rating"),
            func.avg(Review.sentiment_score).label("avg_confidence"),
        )
        .join(Review, Document.id == Review.product_id)
        .group_by(Document.category)
        .order_by(Document.category)
    )
    cat_result = await db.execute(cat_query)
    category_breakdown = [
        {
            "category": row.category,
            "total": row.total,
            "positive": row.positive or 0,
            "negative": row.negative or 0,
            "neutral": row.neutral or 0,
            "positive_pct": round(((row.positive or 0) / row.total) * 100, 1) if row.total else 0,
            "negative_pct": round(((row.negative or 0) / row.total) * 100, 1) if row.total else 0,
            "avg_rating": round(float(row.avg_rating or 0), 2),
            "avg_confidence": round(float(row.avg_confidence or 0), 3),
        }
        for row in cat_result.all()
    ]

    # 4. Top 10 most negatively reviewed products (flagged for attention)
    flagged_query = (
        select(
            Document.id,
            Document.title,
            Document.category,
            func.count(Review.id).label("total"),
            func.sum(case((Review.sentiment == 'NEGATIVE', 1), else_=0)).label("neg_count"),
            func.avg(Review.rating).label("avg_rating"),
        )
        .join(Review, Document.id == Review.product_id)
        .group_by(Document.id, Document.title, Document.category)
        .having(func.count(Review.id) >= 5)
        .order_by(
            (func.sum(case((Review.sentiment == 'NEGATIVE', 1), else_=0)) * 1.0 / func.count(Review.id)).desc()
        )
        .limit(10)
    )
    flagged_result = await db.execute(flagged_query)
    flagged_products = [
        {
            "product_id": row.id,
            "product_title": row.title,
            "category": row.category,
            "total_reviews": row.total,
            "negative_count": row.neg_count or 0,
            "negative_pct": round(((row.neg_count or 0) / row.total) * 100, 1) if row.total else 0,
            "avg_rating": round(float(row.avg_rating or 0), 1),
        }
        for row in flagged_result.all()
    ]

    # 5. Rating distribution
    rating_query = select(
        Review.rating,
        func.count(Review.id).label("count"),
    ).group_by(Review.rating).order_by(Review.rating)
    rating_result = await db.execute(rating_query)
    rating_distribution = {row.rating: row.count for row in rating_result.all()}

    # 6. Total stats
    total_query = select(func.count(Review.id)).select_from(Review)
    total_result = await db.execute(total_query)
    total_reviews = total_result.scalar() or 0

    products_query = select(func.count(func.distinct(Review.product_id)))
    products_result = await db.execute(products_query)
    products_with_reviews = products_result.scalar() or 0

    return {
        "total_reviews": total_reviews,
        "products_with_reviews": products_with_reviews,
        "sentiment_distribution": sentiment_distribution,
        "confidence_histogram": confidence_histogram,
        "category_breakdown": category_breakdown,
        "flagged_products": flagged_products,
        "rating_distribution": rating_distribution,
    }


@router.get("/analytics/keyword-extraction")
async def extract_sentiment_keywords(
    sentiment: str = "NEGATIVE",
    limit: int = 15,
    db: AsyncSession = Depends(get_db)
):
    """
    TF-IDF-style keyword extraction from reviews of a given sentiment.
    Identifies the most distinctive words in positive vs negative reviews
    using frequency analysis — a core NLP technique.
    """
    import re
    from collections import Counter

    # Fetch reviews
    result = await db.execute(
        select(Review.content)
        .where(Review.sentiment == sentiment.upper())
        .limit(5000)
    )
    reviews = result.scalars().all()

    if not reviews:
        return {"sentiment": sentiment, "keywords": [], "total_analyzed": 0}

    # Tokenize and count
    stopwords = {
        "the", "a", "an", "is", "it", "to", "and", "of", "for", "in", "on", "with",
        "that", "this", "was", "are", "be", "has", "have", "had", "but", "not", "we",
        "our", "they", "their", "from", "or", "at", "by", "as", "can", "so", "if",
        "than", "been", "its", "also", "were", "would", "will", "do", "does", "did",
        "just", "more", "very", "about", "up", "out", "all", "no", "some", "what",
        "into", "only", "after", "over", "such", "even", "most", "any", "each",
        "when", "which", "who", "how", "much", "well", "these", "those", "them",
        "you", "your", "i", "my", "me", "he", "she", "his", "her", "us", "am",
        "purchased", "product", "school", "students", "one", "two", "get", "got",
    }

    word_counter = Counter()
    bigram_counter = Counter()

    for review in reviews:
        words = re.findall(r'\b[a-z]{3,}\b', review.lower())
        filtered = [w for w in words if w not in stopwords]
        word_counter.update(filtered)

        # Bigrams for richer insight
        for j in range(len(filtered) - 1):
            bigram_counter[f"{filtered[j]} {filtered[j+1]}"] += 1

    # Combine top unigrams and bigrams
    top_words = [
        {"term": word, "count": count, "type": "word"}
        for word, count in word_counter.most_common(limit)
    ]
    top_bigrams = [
        {"term": bigram, "count": count, "type": "phrase"}
        for bigram, count in bigram_counter.most_common(limit)
        if count >= 3
    ]

    return {
        "sentiment": sentiment.upper(),
        "total_analyzed": len(reviews),
        "top_keywords": top_words,
        "top_phrases": top_bigrams[:10],
    }


@router.get("/{product_id}", response_model=list[ReviewResponse])
async def get_product_reviews(product_id: str, db: AsyncSession = Depends(get_db)):
    """Gets all reviews for a specific product."""
    result = await db.execute(
        select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews

@router.get("/{product_id}/ai-summary")
async def get_ai_root_cause_summary(product_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates a structured AI root cause analysis from negative reviews using Groq LLM.
    Demonstrates LLM-powered analytics: the system reads negative reviews, identifies
    common complaint patterns, and generates actionable recommendations.
    """
    result = await db.execute(
        select(Review.content, Review.rating, Review.sentiment_score)
        .where(Review.product_id == product_id, Review.sentiment == "NEGATIVE")
        .order_by(Review.sentiment_score.desc())
        .limit(25)
    )
    negative_reviews = result.all()
    
    if not negative_reviews:
        return {"summary": "No negative feedback found for this product.", "type": "info"}

    # Also get positive reviews for contrast
    pos_result = await db.execute(
        select(Review.content)
        .where(Review.product_id == product_id, Review.sentiment == "POSITIVE")
        .limit(10)
    )
    positive_reviews = pos_result.scalars().all()
        
    neg_text = "\n".join([f"- [Rating: {r.rating}/5, Confidence: {r.sentiment_score:.0%}] {r.content}" for r in negative_reviews])
    pos_text = "\n".join([f"- {r}" for r in positive_reviews[:5]]) if positive_reviews else "No positive reviews available."

    prompt = f"""You are an expert product analytics AI. Analyze these customer reviews and provide a structured root cause analysis.

NEGATIVE REVIEWS ({len(negative_reviews)} total):
{neg_text}

POSITIVE REVIEWS (for contrast):
{pos_text}

Provide your analysis in this exact format:

## Root Causes
- [List 2-3 specific root causes identified from the negative reviews]

## Risk Level
[HIGH/MEDIUM/LOW] - Based on severity and frequency of complaints

## Impact Score
[X/10] - How much this affects customer satisfaction

## Recommended Actions
1. [Specific actionable recommendation]
2. [Second recommendation]
3. [Third recommendation]

## Sentiment Pattern
[Brief note on whether negative sentiment is about quality, support, pricing, or usability]"""

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        return {"summary": response.content, "type": "analysis", "reviews_analyzed": len(negative_reviews)}
    except Exception as e:
        print(f"AI Summarization failed: {e}")
        return {"summary": "AI Summarization service is currently unavailable.", "type": "error"}

@router.get("/")
async def get_all_reviews(db: AsyncSession = Depends(get_db)):
    """Gets all reviews for the admin dashboard."""
    # Join with Document to get product title
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Review).options(selectinload(Review.product)).order_by(Review.created_at.desc()))
    reviews = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "product_id": r.product_id,
            "product_title": r.product.title if r.product else "Unknown",
            "user_email": r.user_email,
            "rating": r.rating,
            "content": r.content,
            "sentiment": r.sentiment,
            "sentiment_score": r.sentiment_score,
            "created_at": r.created_at
        }
        for r in reviews
    ]
