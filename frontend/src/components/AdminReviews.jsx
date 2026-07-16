import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';
import FormattedText from './FormattedText';
import { 
  IconSparkles, 
  IconBot, 
  IconBriefcase, 
  IconChart, 
  IconTag, 
  IconAlertTriangle, 
  IconFileText, 
  IconMessageSquare, 
  IconBrain,
  IconTrendingUp,
  IconThumbsUp,
  IconThumbsDown
} from './Icons';

const AdminReviews = () => {
  const [productStats, setProductStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [globalAnalytics, setGlobalAnalytics] = useState(null);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [keywords, setKeywords] = useState({ negative: null, positive: null });
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  const [activeView, setActiveView] = useState('overview'); // overview | products | product-detail

  useEffect(() => {
    fetchProductStats();
    fetchGlobalAnalytics();
    fetchKeywords();
  }, []);

  const fetchProductStats = async () => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/reviews/product-stats`);
      const data = await res.json();
      setProductStats(data);
    } catch (err) { console.error(err); }
    setLoadingStats(false);
  };

  const fetchGlobalAnalytics = async () => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/reviews/analytics/global`);
      const data = await res.json();
      setGlobalAnalytics(data);
    } catch (err) { console.error(err); }
    setLoadingGlobal(false);
  };

  const fetchKeywords = async () => {
    setLoadingKeywords(true);
    try {
      const [negRes, posRes] = await Promise.all([
        fetch(`${CONFIG.API_URL}/api/reviews/analytics/keyword-extraction?sentiment=NEGATIVE`),
        fetch(`${CONFIG.API_URL}/api/reviews/analytics/keyword-extraction?sentiment=POSITIVE`),
      ]);
      const negData = await negRes.json();
      const posData = await posRes.json();
      setKeywords({ negative: negData, positive: posData });
    } catch (err) { console.error(err); }
    setLoadingKeywords(false);
  };

  const fetchProductReviews = async (product) => {
    setSelectedProduct(product);
    setActiveView('product-detail');
    setLoadingReviews(true);
    setAiSummary(null);
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/reviews/${product.product_id}`);
      const data = await res.json();
      setProductReviews(data);
    } catch (err) { console.error(err); }
    setLoadingReviews(false);
  };

  const fetchAiSummary = async () => {
    setLoadingAiSummary(true);
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/reviews/${selectedProduct.product_id}/ai-summary`);
      const data = await res.json();
      setAiSummary(data);
    } catch (err) {
      console.error(err);
      setAiSummary({ summary: "Failed to load AI summary.", type: "error" });
    }
    setLoadingAiSummary(false);
  };

  const getSentimentBadge = (sentiment, score) => {
    let color = '#64748b', bg = '#f1f5f9';
    if (sentiment === 'POSITIVE') { color = '#15803d'; bg = '#dcfce7'; }
    if (sentiment === 'NEGATIVE') { color = '#b91c1c'; bg = '#fee2e2'; }
    return (
      <span style={{ background: bg, color, padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
        {sentiment} {score ? `(${(score * 100).toFixed(0)}%)` : ''}
      </span>
    );
  };

  // ─── CSS-only bar chart helper ───
  const Bar = ({ value, max, color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
      <span style={{ fontSize: '0.75rem', width: '80px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease', minWidth: value > 0 ? '2px' : '0' }} />
      </div>
      <span style={{ fontSize: '0.75rem', width: '50px', color: '#334155', fontWeight: 700 }}>{value.toLocaleString()}</span>
    </div>
  );

  const cardStyle = { background: 'white', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
  const headerStyle = { margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' };

  if (loadingStats || loadingGlobal) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading NLP analytics dashboard...</div>;

  // ─── PRODUCT DETAIL VIEW ───
  if (activeView === 'product-detail' && selectedProduct) {
    return (
      <div>
        <button onClick={() => { setActiveView('products'); setSelectedProduct(null); }}
          style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Products
        </button>

        {/* Product sentiment header */}
        <div style={{ ...cardStyle, borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedProduct.product_title}</h3>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Category: {selectedProduct.category} &nbsp;|&nbsp; Avg Rating: {'★'.repeat(Math.round(selectedProduct.avg_rating || 0))}{'☆'.repeat(5 - Math.round(selectedProduct.avg_rating || 0))} ({selectedProduct.avg_rating})
            &nbsp;|&nbsp; Model Confidence: {((selectedProduct.avg_confidence || 0) * 100).toFixed(0)}%
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{selectedProduct.total_reviews}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Reviews</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#15803d' }}>{Math.round((selectedProduct.positive_count / selectedProduct.total_reviews) * 100)}%</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>Positive</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b91c1c' }}>{Math.round((selectedProduct.negative_count / selectedProduct.total_reviews) * 100)}%</div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 600 }}>Negative</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#64748b' }}>{Math.round((selectedProduct.neutral_count / selectedProduct.total_reviews) * 100)}%</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Neutral</div>
            </div>
          </div>
          {/* Sentiment bar */}
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '1rem' }}>
            <div style={{ width: `${(selectedProduct.positive_count / selectedProduct.total_reviews) * 100}%`, background: '#22c55e' }} />
            <div style={{ width: `${(selectedProduct.neutral_count / selectedProduct.total_reviews) * 100}%`, background: '#94a3b8' }} />
            <div style={{ width: `${(selectedProduct.negative_count / selectedProduct.total_reviews) * 100}%`, background: '#ef4444' }} />
          </div>
        </div>

        {/* AI Root Cause Analysis */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ ...headerStyle, margin: 0 }}>
              <IconBrain size={20} color="var(--primary)" /> AI Root Cause Analysis
              <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>Groq LLM + NLP Pipeline</span>
            </h4>
            <button onClick={fetchAiSummary} disabled={loadingAiSummary}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: loadingAiSummary ? 'not-allowed' : 'pointer', opacity: loadingAiSummary ? 0.7 : 1 }}>
              {loadingAiSummary ? '⏳ Analyzing Reviews...' : '🔍 Run AI Analysis'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
            The AI reads all negative reviews, identifies complaint patterns using NLP, and generates a structured root cause report with risk scores and actionable recommendations.
          </p>
          {aiSummary && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', lineHeight: '1.6' }}>
              {aiSummary.reviews_analyzed && (
                <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <IconChart size={14} /> Analyzed {aiSummary.reviews_analyzed} negative reviews with DistilBERT sentiment scores
                </div>
              )}
              <FormattedText text={aiSummary.summary} />
            </div>
          )}
        </div>

        {/* Individual Reviews */}
        <h4 style={headerStyle}><IconFileText size={18} color="var(--primary)" /> Individual Reviews ({productReviews.length})</h4>
        {loadingReviews ? <div>Loading reviews...</div> : (
          <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
            {productReviews.map(r => (
              <div key={r.id} style={{ ...cardStyle, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      By {r.user_email} • {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {getSentimentBadge(r.sentiment, r.sentiment_score)}
                </div>
                <p style={{ margin: 0, color: '#334155', fontStyle: 'italic', lineHeight: '1.5', fontSize: '0.9rem' }}>"{r.content}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN DASHBOARD ───
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>NLP Sentiment Intelligence Dashboard</h2>
      </div>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Real-time NLP pipeline powered by <strong>Hugging Face DistilBERT</strong> • {globalAnalytics?.total_reviews?.toLocaleString()} reviews analyzed across {globalAnalytics?.products_with_reviews?.toLocaleString()} products
      </p>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveView('overview')}
          style={{
            padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: activeView === 'overview' ? 'var(--primary)' : 'transparent',
            color: activeView === 'overview' ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
          <IconChart size={16} /> NLP Analytics Overview
        </button>
        <button onClick={() => setActiveView('products')}
          style={{
            padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: activeView === 'products' ? 'var(--primary)' : 'transparent',
            color: activeView === 'products' ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
          <IconFileText size={16} /> Product-Level Analysis
        </button>
      </div>

      {activeView === 'overview' && globalAnalytics && (
        <div>
          {/* KPI Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ ...cardStyle, borderTop: '3px solid var(--primary)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{globalAnalytics.total_reviews.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Reviews Processed</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>by DistilBERT NLP model</div>
            </div>
            <div style={{ ...cardStyle, borderTop: '3px solid #22c55e', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>
                {globalAnalytics.sentiment_distribution?.POSITIVE?.count?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Positive</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                Avg confidence: {((globalAnalytics.sentiment_distribution?.POSITIVE?.avg_score || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ ...cardStyle, borderTop: '3px solid #ef4444', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>
                {globalAnalytics.sentiment_distribution?.NEGATIVE?.count?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Negative</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                Avg confidence: {((globalAnalytics.sentiment_distribution?.NEGATIVE?.avg_score || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ ...cardStyle, borderTop: '3px solid #94a3b8', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#64748b' }}>
                {globalAnalytics.sentiment_distribution?.NEUTRAL?.count?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Neutral</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                Avg confidence: {((globalAnalytics.sentiment_distribution?.NEUTRAL?.avg_score || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Confidence Score Distribution */}
            <div style={cardStyle}>
              <h4 style={headerStyle}><IconTrendingUp size={18} color="var(--primary)" /> Model Confidence Distribution</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
                DistilBERT sentiment classification confidence scores across all reviews
              </p>
              {globalAnalytics.confidence_histogram.map((count, i) => (
                <Bar key={i} label={`${(i * 10)}–${(i + 1) * 10}%`} value={count} max={Math.max(...globalAnalytics.confidence_histogram)} color={i >= 8 ? '#22c55e' : i >= 5 ? '#3b82f6' : '#f59e0b'} />
              ))}
            </div>

            {/* Rating Distribution */}
            <div style={cardStyle}>
              <h4 style={headerStyle}><IconSparkles size={18} color="var(--primary)" /> Rating vs Sentiment Correlation</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
                How user ratings correlate with NLP-detected sentiment labels
              </p>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = globalAnalytics.rating_distribution?.[rating] || 0;
                const maxCount = Math.max(...Object.values(globalAnalytics.rating_distribution || {}));
                const colors = { 5: '#22c55e', 4: '#84cc16', 3: '#f59e0b', 2: '#f97316', 1: '#ef4444' };
                return <Bar key={rating} label={`${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`} value={count} max={maxCount} color={colors[rating]} />;
              })}
            </div>
          </div>

          {/* Category Sentiment Breakdown */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <h4 style={headerStyle}><IconTag size={18} color="var(--primary)" /> Sentiment by Product Category</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
              Cross-category NLP analysis — identifies which product categories have the highest negative sentiment rates
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Total</th>
                    <th style={{ padding: '0.75rem', color: '#15803d', fontWeight: 700, textAlign: 'center' }}>Positive %</th>
                    <th style={{ padding: '0.75rem', color: '#b91c1c', fontWeight: 700, textAlign: 'center' }}>Negative %</th>
                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Avg Rating</th>
                    <th style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Avg Confidence</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Sentiment Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {globalAnalytics.category_breakdown.map(cat => (
                    <tr key={cat.category} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{cat.category}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{cat.total.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>{cat.positive_pct}%</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#b91c1c', fontWeight: 700 }}>{cat.negative_pct}%</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{'★'.repeat(Math.round(cat.avg_rating))} {cat.avg_rating}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{(cat.avg_confidence * 100).toFixed(1)}%</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '120px' }}>
                          <div style={{ width: `${cat.positive_pct}%`, background: '#22c55e' }} />
                          <div style={{ width: `${100 - cat.positive_pct - cat.negative_pct}%`, background: '#94a3b8' }} />
                          <div style={{ width: `${cat.negative_pct}%`, background: '#ef4444' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Negative Keywords */}
            <div style={cardStyle}>
              <h4 style={headerStyle}><IconThumbsDown size={18} color="#ef4444" /> Top Negative Keywords</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
                TF-IDF keyword extraction from {keywords.negative?.total_analyzed?.toLocaleString() || 0} negative reviews
              </p>
              {loadingKeywords ? <div>Extracting keywords...</div> : (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {keywords.negative?.top_keywords?.slice(0, 12).map((k, i) => (
                      <span key={i} style={{
                        background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '9999px',
                        fontSize: `${Math.max(0.7, Math.min(1.1, 0.7 + (k.count / (keywords.negative?.top_keywords?.[0]?.count || 1)) * 0.4))}rem`,
                        fontWeight: 600
                      }}>
                        {k.term} <span style={{ opacity: 0.6 }}>({k.count})</span>
                      </span>
                    ))}
                  </div>
                  {keywords.negative?.top_phrases?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IconMessageSquare size={14} /> Common Complaint Phrases:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {keywords.negative.top_phrases.slice(0, 8).map((p, i) => (
                          <span key={i} style={{ background: '#fef2f2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #fecaca' }}>
                            "{p.term}" ({p.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Positive Keywords */}
            <div style={cardStyle}>
              <h4 style={headerStyle}><IconThumbsUp size={18} color="#22c55e" /> Top Positive Keywords</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
                TF-IDF keyword extraction from {keywords.positive?.total_analyzed?.toLocaleString() || 0} positive reviews
              </p>
              {loadingKeywords ? <div>Extracting keywords...</div> : (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {keywords.positive?.top_keywords?.slice(0, 12).map((k, i) => (
                      <span key={i} style={{
                        background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '9999px',
                        fontSize: `${Math.max(0.7, Math.min(1.1, 0.7 + (k.count / (keywords.positive?.top_keywords?.[0]?.count || 1)) * 0.4))}rem`,
                        fontWeight: 600
                      }}>
                        {k.term} <span style={{ opacity: 0.6 }}>({k.count})</span>
                      </span>
                    ))}
                  </div>
                  {keywords.positive?.top_phrases?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IconMessageSquare size={14} /> Common Praise Phrases:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {keywords.positive.top_phrases.slice(0, 8).map((p, i) => (
                          <span key={i} style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #bbf7d0' }}>
                            "{p.term}" ({p.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flagged Products */}
          <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
            <h4 style={headerStyle}><IconAlertTriangle size={18} color="#ef4444" /> AI-Flagged Products (Highest Negative Sentiment Rate)</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '-0.5rem 0 1rem 0' }}>
              Products automatically flagged by the NLP pipeline for having the highest proportion of negative reviews
            </p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {globalAnalytics.flagged_products.map((p, i) => (
                <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: i < 3 ? '#fef2f2' : '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: i < 3 ? '#ef4444' : '#94a3b8', width: '30px' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.product_title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.category} • {p.total_reviews} reviews • Avg Rating: {p.avg_rating}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{p.negative_pct}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>negative</div>
                  </div>
                  <button onClick={() => fetchProductReviews(productStats.find(s => s.product_id === p.product_id) || p)}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Analyze
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'products' && (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
            Showing {productStats.length} products with reviews • Sorted by negative review count (descending)
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {productStats.map(stat => (
              <div key={stat.product_id} style={{ ...cardStyle, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{stat.product_title}</h4>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    <span><strong>Reviews:</strong> {stat.total_reviews}</span>
                    <span style={{ color: '#15803d' }}><strong>+{stat.positive_count}</strong></span>
                    <span style={{ color: '#b91c1c' }}><strong>-{stat.negative_count}</strong></span>
                    <span>◉ {stat.neutral_count}</span>
                    <span>★ {stat.avg_rating}</span>
                    <span>Conf: {(stat.avg_confidence * 100).toFixed(0)}%</span>
                  </div>
                  {/* Mini bar */}
                  <div style={{ display: 'flex', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '6px', width: '200px' }}>
                    <div style={{ width: `${(stat.positive_count / stat.total_reviews) * 100}%`, background: '#22c55e' }} />
                    <div style={{ width: `${(stat.neutral_count / stat.total_reviews) * 100}%`, background: '#94a3b8' }} />
                    <div style={{ width: `${(stat.negative_count / stat.total_reviews) * 100}%`, background: '#ef4444' }} />
                  </div>
                </div>
                <button onClick={() => fetchProductReviews(stat)}
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;


