import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { IconTarget, IconBriefcase, IconCart, IconSparkles } from '../components/Icons';
import FormattedText from '../components/FormattedText';

const STEPS = ['School Profile', 'Budget & Focus', 'Your Proposal'];

export default function Recommend() {
  const { addToCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [productsDb, setProductsDb] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/documents/')
      .then(res => res.json())
      .then(data => {
        if (!data.documents) throw new Error("No documents returned");
        const mapped = data.documents.map(doc => {
          let meta = {};
          if (doc.metadata_json) {
            try { meta = typeof doc.metadata_json === 'string' ? JSON.parse(doc.metadata_json) : doc.metadata_json; } catch(e){}
          }
          return {
            id: doc.id,
            title: doc.title,
            category: doc.category,
            price_usd: meta.price_usd || 0,
            image_url: meta.image_url || ''
          };
        });
        setProductsDb(mapped);
      })
      .catch(err => console.error("Could not fetch product list", err));
  }, []);

  const [profile, setProfile] = useState({
    description: '',
    category: '',
    budget_range: '',
    priorities: [],
    top_k: 5,
  });

  const CATEGORIES = ['Smart Classrooms', 'STEM Labs', 'Software & ERP', 'Library Automation'];
  const PRIORITIES = ['NEP 2020 Compliance', 'GCC Standards', 'Cost-Efficiency', 'Premium Quality', 'Scalability'];

  const togglePriority = (p) => {
    setProfile(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter(x => x !== p)
        : [...prev.priorities, p],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.recommend(profile);
      setResults(data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuote = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to save quotes.");
      return;
    }
    try {
      // Calculate total amount from recommended products
      const total_amount = results.recommendations?.reduce((acc, rec) => {
        const dbProduct = productsDb.find(p => p.id === rec.id);
        return acc + (dbProduct ? dbProduct.price_usd : 0);
      }, 0) || 0;

      const res = await fetch('http://localhost:8000/api/quotes/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: profile.description.substring(0, 50) + "...",
          total_amount
        })
      });

      if (res.ok) {
        alert("Quote saved to your account successfully!");
      } else {
        alert("Failed to save quote. You might not be linked to an organization.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving quote.");
    }
  };

  return (
    <div>
      <div className="section-header text-center">
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary)', display: 'flex' }}><IconTarget size={32} /></span> AI Infrastructure Planner
        </h2>
        <p>Enter your school's requirements and exact budget, and our AI will build a complete procurement proposal.</p>
      </div>

      {/* Wizard Steps */}
      <div className="wizard-steps">
        {STEPS.map((label, i) => (
          <div key={i} className={`wizard-step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
            <div className="wizard-step-number">
              {i < step ? '✓' : i + 1}
            </div>
            <span className="wizard-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Description */}
      {step === 0 && (
        <div className="card glass-effect" style={{ maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Describe Your Campus Needs</h3>
          <textarea
            className="input"
            style={{ height: '120px', resize: 'vertical' }}
            placeholder="E.g., We are upgrading a high school for 1000 students. We want to implement a new robotics lab and need modern interactive displays for 5 classrooms."
            value={profile.description}
            onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-between mt-lg">
            <div></div>
            <button
              className="btn btn-primary"
              disabled={profile.description.length < 10}
              onClick={() => setStep(1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preferences */}
      {step === 1 && (
        <div className="card glass-effect" style={{ maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Budget & Priorities</h3>

          {/* Budget */}
          <div className="mb-lg">
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>
              Maximum Budget (USD)
            </label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g., $15,000" 
              value={profile.budget_range}
              onChange={(e) => setProfile(prev => ({ ...prev, budget_range: e.target.value }))}
            />
          </div>

          {/* Priorities */}
          <div className="mb-lg">
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>
              Procurement Priorities
            </label>
            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  className={`btn ${profile.priorities.includes(p) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 12px' }}
                  onClick={() => togglePriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-lg" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !profile.budget_range}>
              {loading ? <><span className="spinner"></span> Generating Proposal...</> : <><IconSparkles size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Generate Proposal</>}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card mt-lg" style={{ borderColor: 'var(--accent-tertiary)', maxWidth: '600px', margin: 'var(--space-lg) auto 0' }}>
          <p style={{ color: 'var(--accent-tertiary)' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 2 && results && (
        <div className="mt-lg">
          {/* AI Insights */}
          <div className="card mb-lg glass-effect" style={{ borderColor: 'var(--border-accent)', background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)' }}>
            <div className="flex items-center gap-sm mb-md">
              <span style={{ color: 'var(--primary)', display: 'flex' }}><IconBriefcase size={24} /></span>
              <strong style={{ fontSize: '1.2rem' }}>Consultant Summary</strong>
              <span className="badge badge-green">Generated in {results.latency_ms?.toFixed(0)}ms</span>
            </div>
            <FormattedText text={results.ai_insights} />
          </div>

          {/* Recommendations (Cart) */}
          <h3 className="mb-md">Proposed Cart</h3>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {results.recommendations?.map((rec, i) => (
              <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center gap-sm" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                  <span className="badge badge-purple">{rec.category || 'Product'}</span>
                  <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)', fontWeight: 700 }}>
                    #{i + 1}
                  </span>
                </div>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>{rec.title}</h4>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', flex: 1 }}>
                  {rec.reasoning}
                </div>
                <div className="mt-md" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-sm)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-info)' }}>Recommended Value Match: {(rec.relevance_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-xl">
            <button 
              className="btn btn-primary btn-lg" 
              style={{ marginRight: '1rem' }}
              onClick={() => {
                results.recommendations?.forEach(rec => {
                  const dbProduct = productsDb.find(p => p.id === rec.id);
                  addToCart(dbProduct || { id: rec.id, title: rec.title, category: rec.category, price_usd: 0, image_url: 'https://placehold.co/600x400/1e293b/ffffff?text=Product' });
                });
                window.location.hash = 'cart';
              }}
            >
              <IconCart size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Add Package to Cart
            </button>
            <button className="btn btn-secondary btn-lg" style={{ marginRight: '1rem' }} onClick={handleSaveQuote}>
              <IconTarget size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Save as Quote
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => { setStep(0); setResults(null); }}>
              ← Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
