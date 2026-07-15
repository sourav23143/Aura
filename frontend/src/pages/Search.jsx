import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { IconSparkles } from '../components/Icons';
import FormattedText from '../components/FormattedText';

export default function Search({ initialQuery = '' }) {
  const { addToCart } = useCart();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For standard rendering if AI semantic search isn't triggered
  const [productsDb, setProductsDb] = useState([]);

  // Filtering state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('all'); // 'all', 'under1k', '1k-3k', 'over3k'
  const [inStockOnly, setInStockOnly] = useState(true);

  useEffect(() => {
    // Sync initial query when navigated to from outside
    setQuery(initialQuery);
    if (initialQuery) {
      executeSearch(initialQuery);
    } else {
      // Load all products if no query
      fetchAllProducts();
    }
  }, [initialQuery]);

  const fetchAllProducts = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/documents/')
      .then(res => res.json())
      .then(data => {
        if (!data.documents) throw new Error("No documents returned");
        const mapped = data.documents.map(doc => {
          let meta = {};
          if (doc.metadata_json) {
            try { meta = typeof doc.metadata_json === 'string' ? JSON.parse(doc.metadata_json) : doc.metadata_json; } catch(e){}
          }
          return { id: doc.id, title: doc.title, category: doc.category, price_usd: meta.price_usd || 0, image_url: meta.image_url || 'https://placehold.co/600x400/1e293b/ffffff?text=Product' };
        });
        setProductsDb(mapped);
        setResults(null); // Clear semantic results
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch products");
      })
      .finally(() => setLoading(false));
  };

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Seamlessly use semantic search (which uses AI summary)
      const data = await api.search(searchQuery);
      setResults({
        type: 'search',
        data,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Derive final filtered products
  const displayedItems = useMemo(() => {
    let items = [];
    if (results?.type === 'search') {
      items = (results.data.results || []).map(r => {
        let meta = {};
        if (r.metadata_json) {
          try { meta = typeof r.metadata_json === 'string' ? JSON.parse(r.metadata_json) : r.metadata_json; } catch(e){}
        }
        return {
          ...r,
          price_usd: meta.price_usd || 0,
          image_url: meta.image_url || 'https://placehold.co/600x400/1e293b/ffffff?text=Product'
        };
      });
    } else {
      items = productsDb;
    }

    // Normalize mapping just in case
    items = items.map(item => {
      const isSearchResult = !!results;
      
      if (isSearchResult) {
        // Semantic search results only have vector metadata, so map back to full product
        const docId = item.metadata_json?.doc_id || item.id;
        const realProduct = productsDb.find(p => p.id === docId);
        
        if (realProduct) {
          // Deduplicate if multiple chunks from same doc match (though we shouldn't show multiple, just take the first)
          return { ...realProduct, score: item.score };
        }
      }
      return item;
    });
    
    // Deduplicate by ID
    const seen = new Set();
    items = items.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    if (selectedCategories.length > 0) {
      items = items.filter(item => selectedCategories.includes(item.category));
    }

    if (selectedPrice !== 'all') {
      items = items.filter(item => {
        if (selectedPrice === 'under1k') return item.price_usd < 1000;
        if (selectedPrice === '1k-3k') return item.price_usd >= 1000 && item.price_usd <= 3000;
        if (selectedPrice === 'over3k') return item.price_usd > 3000;
        return true;
      });
    }

    // In a real app we'd filter by inventory count, but for now we'll just mock it
    // if (inStockOnly) items = items.filter(...)

    return items;
  }, [results, productsDb, selectedCategories, selectedPrice, inStockOnly]);

  return (
    <div className="responsive-search-layout">
      {/* Filter Sidebar */}
      <aside className="responsive-search-sidebar">
        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xl)', fontWeight: 700 }}>Filters</h2>
        
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: '#333' }}>Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Smart Infrastructure', 'STEM', 'Software', 'Digital Content'].map((cat) => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  style={{ accentColor: 'var(--primary)' }} 
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: '#333' }}>Price Range</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="radio" name="price" checked={selectedPrice === 'all'} onChange={() => setSelectedPrice('all')} style={{ accentColor: 'var(--primary)' }} /> All Prices
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="radio" name="price" checked={selectedPrice === 'under1k'} onChange={() => setSelectedPrice('under1k')} style={{ accentColor: 'var(--primary)' }} /> Under $1,000
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="radio" name="price" checked={selectedPrice === '1k-3k'} onChange={() => setSelectedPrice('1k-3k')} style={{ accentColor: 'var(--primary)' }} /> $1,000 - $3,000
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="radio" name="price" checked={selectedPrice === 'over3k'} onChange={() => setSelectedPrice('over3k')} style={{ accentColor: 'var(--primary)' }} /> Over $3,000
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: '#333' }}>Availability</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> In Stock
          </label>
        </div>
      </aside>

      {/* Main Results Area */}
      <div className="responsive-search-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {query ? `Search Results` : 'All Products'}
          </h1>
          
          <form 
            onSubmit={handleSearch}
            style={{ display: 'flex', maxWidth: '350px', width: '100%', position: 'relative' }}
          >
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input" 
              placeholder="Semantic AI Search..." 
              style={{ paddingRight: '40px', paddingLeft: '1rem', borderRadius: '24px' }}
            />
            <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <span className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--primary)' }}></span>
            <p style={{ marginTop: '1rem', color: '#888' }}>AI is analyzing catalog...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div>
            {/* AI Summary Section if present */}
            {results && results.data.ai_summary && (
              <div className="glass-effect" style={{ border: '1px solid #93c5fd', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', display: 'flex', gap: '1rem', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.15)' }}>
                <div style={{ alignSelf: 'flex-start', color: 'var(--primary)', marginTop: '4px' }}>
                  <IconSparkles size={28} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.4rem', color: 'var(--primary)' }}>AI Insight</h4>
                  <FormattedText text={results.data.ai_summary} />
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {displayedItems.length > 0 ? (
                displayedItems.map((item, index) => {
                  return (
                    <div 
                      className="card" 
                      key={item.id || index} 
                      style={{ transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative', display: 'flex', flexDirection: 'column' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {item.score && (
                         <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                           {(item.score * 100).toFixed(0)}% MATCH
                         </div>
                      )}
                      <div style={{ padding: 'var(--space-md)', textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=Product' }}
                          style={{ width: '100%', height: '140px', objectFit: 'contain' }} 
                        />
                      </div>
                      
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.2rem', lineHeight: '1.3' }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
                        SKU: {item.id ? item.id.toUpperCase() : 'N/A'} | {item.category}
                      </p>
                      
                      {/* Star Rating Mock */}
                      <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                        ★ ★ ★ ★ ★ <span style={{ color: '#888', marginLeft: '4px' }}>(28)</span>
                      </div>
                      
                      <div style={{ marginBottom: '0.6rem', flexGrow: 1 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111111', marginBottom: '0.1rem' }}>B2B pricing</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111111' }}>
                            ${item.price_usd.toLocaleString()}.00
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
                          In Stock
                        </p>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}
                        onClick={() => addToCart(item)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#888' }}>
                  <p>No products match your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
