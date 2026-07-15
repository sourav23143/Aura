import { useState, useEffect } from 'react';
import { IconLaptop, IconBot, IconGlasses, IconChart, IconMicroscope, IconBook } from '../components/Icons';
import { useCart } from '../context/CartContext';

export default function Home({ onNavigate }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "Back to School Sale 2026",
      title: "Upgrade your campus infrastructure.",
      desc: "Get up to 30% off on bulk orders of Smart Boards, STEM Robotics kits, and NEP 2020 software.",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
    },
    {
      badge: "New Arrival",
      title: "Next-Gen STEM Robotics Kits.",
      desc: "Prepare your students for the future with advanced AI and robotics kits designed for Middle and High Schools.",
      img: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=600&h=400&fit=crop"
    },
    {
      badge: "Bulk Discount",
      title: "Modular Ergonomic Furniture.",
      desc: "Transform your classrooms into collaborative learning spaces with our modern, durable furniture.",
      img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop"
    }
  ];

  useEffect(() => {
    fetch('http://localhost:8000/api/documents/')
      .then(res => res.json())
      .then(data => {
        if (!data.documents) throw new Error("No documents returned");
        const mapped = data.documents.map(doc => {
          let meta = {};
          if (doc.metadata_json) {
            try {
              meta = typeof doc.metadata_json === 'string' ? JSON.parse(doc.metadata_json) : doc.metadata_json;
            } catch (e) { console.error(e); }
          }
          return {
            id: doc.id,
            title: doc.title,
            category: doc.category,
            price_usd: meta.price_usd || 0,
            image_url: meta.image_url || 'https://placehold.co/600x400/1e293b/ffffff?text=Product'
          };
        });
        setProducts(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
      
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Real Promotional Hero Banner */}
      <section 
        className="hero-banner"
        style={{ backgroundImage: `url(${slides[currentSlide].img})` }}
      >
        {/* Dark overlay for better text readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.5) 100%)', zIndex: 1 }}></div>

        <div className="hero-banner-content">
          <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            {slides[currentSlide].badge}
          </span>
          <h1>
            {slides[currentSlide].title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
            {slides[currentSlide].desc}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary glass-effect" onClick={() => onNavigate('search')}>Shop Infrastructure</button>
            <button className="btn btn-secondary glass-effect" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => onNavigate('recommend')}>Use AI Planner</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '2rem' }}>
            {slides.map((_, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentSlide(i)}
                style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentSlide === i ? 'white' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>Shop by Category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-md)' }}>
          {[
            { icon: <IconLaptop size={32} color="var(--primary)" />, name: 'Smart Classrooms', query: 'Smart Infrastructure' },
            { icon: <IconBot size={32} color="var(--primary)" />, name: 'STEM Robotics', query: 'STEM' },
            { icon: <IconGlasses size={32} color="var(--primary)" />, name: 'AR/VR Labs', query: 'Digital Content' },
            { icon: <IconChart size={32} color="var(--primary)" />, name: 'School Software', query: 'Software' },
            { icon: <IconMicroscope size={32} color="var(--primary)" />, name: 'Science Labs', query: 'Infrastructure' },
            { icon: <IconBook size={32} color="var(--primary)" />, name: 'Library Systems', query: 'Library' }
          ].map((cat, i) => (
            <div key={i} onClick={() => onNavigate(`search?q=${encodeURIComponent(cat.query)}`)} style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto var(--space-sm)', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                {cat.icon}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Featured Products for Institutions</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('search'); }} style={{ fontSize: '0.9rem', fontWeight: 600 }}>See all recommendations →</a>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <span className="spinner" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--primary)', width: '40px', height: '40px' }}></span>
          </div>
        ) : (
          <div className="card-grid">
            {products.map((product) => (
              <div 
                className="card" 
                key={product.id} 
                style={{ transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Discount Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--danger)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                  SAVE 15%
                </div>
                
                <div style={{ padding: 'var(--space-xl) var(--space-md) var(--space-md)', textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    style={{ width: '100%', height: '160px', objectFit: 'contain' }} 
                  />
                </div>
                
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem', lineHeight: '1.3' }}>
                  {product.title}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#555555', marginBottom: '0.3rem' }}>
                  SKU: {product.id.toUpperCase()}
                </p>
                
                {/* Star Rating Mock */}
                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                  ★ ★ ★ ★ ★ <span style={{ color: '#888', marginLeft: '4px' }}>(42 reviews)</span>
                </div>
                
                <div style={{ marginBottom: '0.8rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111111', marginBottom: '0.1rem' }}>B2B pricing</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111' }}>
                      ${product.price_usd?.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
                    In Stock (Ships in 48h)
                  </p>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', fontWeight: 600 }}
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
