import { CONFIG } from './config';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Recommend from './pages/Recommend';
import Monitor from './pages/Monitor';
import Cart from './pages/Cart';
import Account from './pages/Account';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import StaticPage from './pages/StaticPage';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [globalQuery, setGlobalQuery] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  
  // Autocomplete state
  const [globalQueryInput, setGlobalQueryInput] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [productsDb, setProductsDb] = useState([]);
  const [isAccountHovered, setIsAccountHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch catalog for global autocomplete
  useEffect(() => {
    fetch('CONFIG.API_URL/api/documents/')
      .then(res => res.json())
      .then(data => {
        if (!data.documents) return;
        const mapped = data.documents.map(doc => {
          let meta = {};
          if (doc.metadata_json) {
            try { meta = typeof doc.metadata_json === 'string' ? JSON.parse(doc.metadata_json) : doc.metadata_json; } catch(e){}
          }
          return { id: doc.id, title: doc.title, category: doc.category, price_usd: meta.price_usd || 0, image_url: meta.image_url || '' };
        });
        setProductsDb(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  // Update autocomplete results
  useEffect(() => {
    if (globalQueryInput.trim().length > 1) {
      const results = productsDb.filter(p => 
        p.title.toLowerCase().includes(globalQueryInput.toLowerCase()) || 
        p.id.toLowerCase().includes(globalQueryInput.toLowerCase()) ||
        p.category.toLowerCase().includes(globalQueryInput.toLowerCase())
      ).slice(0, 5);
      setAutocompleteResults(results);
    } else {
      setAutocompleteResults([]);
    }
  }, [globalQueryInput, productsDb]);

  // Simple client-side routing based on hash
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '') || 'home';
      const pageName = fullHash.split('?')[0];
      
      // Parse query parameters
      if (fullHash.includes('?')) {
        const queryParams = new URLSearchParams(fullHash.split('?')[1]);
        if (queryParams.has('q')) {
          setGlobalQuery(queryParams.get('q'));
        }
      } else {
        setGlobalQuery(''); // Clear global query if no query string
      }

      if (['home', 'search', 'chat', 'recommend', 'monitor', 'cart', 'account', 'admin', 'admin-login', 'product', 'careers', 'about', 'investor-relations', 'sustainability', 'bulk-purchasing', 'institutional-credit', 'shipping-policies', 'returns'].includes(pageName)) {
        setCurrentPage(pageName);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page) => {
    window.location.hash = page;
    const pageName = page.split('?')[0];
    setCurrentPage(pageName);
    window.scrollTo(0, 0);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const query = e.target.elements.q.value.trim();
    if (query) {
      navigate(`search?q=${encodeURIComponent(query)}`);
    } else {
      navigate('search');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'search': return <Search initialQuery={globalQuery} />;
      case 'chat': return <Chat />;
      case 'recommend': return <Recommend />;
      case 'monitor': return <Monitor onNavigate={navigate} />;
      case 'cart': return user ? <Cart onNavigate={navigate} /> : <Login />;
      case 'account': return user ? <Account onNavigate={navigate} /> : <Login />;
      case 'admin-login': return user?.role === 'admin' ? <AdminDashboard onNavigate={navigate} /> : <Login adminMode={true} />;
      case 'admin': return user?.role === 'admin' ? <AdminDashboard onNavigate={navigate} /> : <Login adminMode={true} />;
      case 'product': {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        return <ProductDetail productId={urlParams.get('id')} onNavigate={navigate} />;
      }
      case 'careers':
      case 'about':
      case 'investor-relations':
      case 'sustainability':
      case 'bulk-purchasing':
      case 'institutional-credit':
      case 'shipping-policies':
      case 'returns':
        return <StaticPage pageId={currentPage} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Announcement Bar */}
      {showAnnouncement && (
        <div style={{ background: '#111111', color: 'white', fontSize: '0.75rem', padding: '0.4rem', textAlign: 'center', letterSpacing: '0.02em', position: 'relative' }}>
          <span style={{ fontWeight: 600 }}>B2B PROMOTION:</span> Free shipping on infrastructure orders over $10,000. <a href="#home" style={{ color: '#93c5fd', textDecoration: 'underline', marginLeft: '8px' }}>Learn More</a>
          <button 
            onClick={() => setShowAnnouncement(false)} 
            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 0 }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Enterprise Navigation */}
      <nav className="navbar glass-effect" style={{ padding: '0 1rem', height: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="responsive-nav-inner">
          
          {/* Logo */}
          <div
            className="navbar-brand"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}
            onClick={() => navigate('home')}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--primary)"/>
              <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, tracking: '-0.5px' }}>Aura</span>
          </div>

          {/* Massive Central Search Bar */}
          <form 
            className="search-box" 
            style={{ flex: 1, margin: '0', position: 'relative', display: 'flex' }}
            onSubmit={handleGlobalSearch}
          >
            <input 
              name="q"
              type="text" 
              className="input" 
              placeholder="Search by keyword, SKU, or category..." 
              style={{ width: '100%', paddingLeft: '45px', paddingRight: '120px' }}
              value={globalQueryInput}
              onChange={(e) => setGlobalQueryInput(e.target.value)}
              autoComplete="off"
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '15px', color: '#555' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', borderRadius: '24px', padding: '0 1.5rem', fontWeight: 600 }}>
              Search
            </button>
            
            {/* Autocomplete Dropdown */}
            {autocompleteResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden', marginTop: '8px' }}>
                {autocompleteResults.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setGlobalQueryInput('');
                      setAutocompleteResults([]);
                      navigate(`search?q=${encodeURIComponent(p.title)}`);
                    }}
                    style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    {p.image_url && <img src={p.image_url} alt={p.title} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/1e293b/ffffff?text=Icon' }} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, color: '#111' }}>{p.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>SKU: {p.id.toUpperCase()}</p>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>${p.price_usd?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Right Icons & Links — Desktop Only */}
          <ul className="navbar-links desktop-only" style={{ minWidth: '200px', justifyContent: 'flex-end', gap: '1.5rem' }}>
            {user?.role === 'admin' && (
              <li>
                <a href="#admin" onClick={(e) => { e.preventDefault(); navigate('admin'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Admin</span>
                </a>
              </li>
            )}
            <li>
              <a href="#recommend" onClick={(e) => { e.preventDefault(); navigate('recommend'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Planner</span>
              </a>
            </li>
            <li>
              <a href="#chat" onClick={(e) => { e.preventDefault(); navigate('chat'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Support</span>
              </a>
            </li>
            <li 
              onMouseEnter={() => setIsAccountHovered(true)} 
              onMouseLeave={() => setIsAccountHovered(false)}
              style={{ position: 'relative' }}
            >
              <a href="#account" onClick={(e) => { e.preventDefault(); navigate('account'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{user ? 'Account' : 'Login'}</span>
              </a>
              {!user && isAccountHovered && (
                <div style={{ position: 'absolute', top: '100%', right: '50%', transform: 'translateX(50%)', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '0.5rem', width: '160px', zIndex: 100 }}>
                  <div onClick={() => navigate('account')} style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>Customer Sign In</div>
                  <div onClick={() => navigate('admin-login')} style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>Admin Portal</div>
                </div>
              )}
            </li>
            <li>
              <a href="#cart" onClick={(e) => { e.preventDefault(); navigate('cart'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', position: 'relative' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Cart</span>
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-4px', background: 'var(--danger)', color: 'white', borderRadius: '50%',
                    width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold'
                  }}>
                    {itemCount}
                  </span>
                )}
              </a>
            </li>
          </ul>

          {/* Mobile: Cart icon + Hamburger */}
          <div className="mobile-menu-toggle" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <a href="#cart" onClick={(e) => { e.preventDefault(); navigate('cart'); }} style={{ position: 'relative', color: 'var(--text-primary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {itemCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                  {itemCount}
                </span>
              )}
            </a>
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Category Navigation Bar */}
        <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
          <ul className="responsive-nav-bottom">
            <li style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('search')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              All Categories
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => navigate('search?q=Smart%20Infrastructure')}>Smart Classrooms</li>
            <li style={{ cursor: 'pointer' }} onClick={() => navigate('search?q=STEM')}>Robotics & STEM</li>
            <li style={{ cursor: 'pointer' }} onClick={() => navigate('search?q=Digital%20Content')}>Digital Content</li>
            <li style={{ cursor: 'pointer' }} onClick={() => navigate('search?q=Software')}>School Software</li>
            <li style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 600 }} onClick={() => navigate('search?q=Clearance')}>Clearance Deals</li>
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay open" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Menu</span>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-primary)' }}>&times;</button>
        </div>
        <ul className="mobile-nav-links">
          {user?.role === 'admin' && (
            <li><a href="#admin" onClick={(e) => { e.preventDefault(); navigate('admin'); setMobileMenuOpen(false); }} style={{ color: 'var(--danger)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Dashboard
            </a></li>
          )}
          <li><a href="#recommend" onClick={(e) => { e.preventDefault(); navigate('recommend'); setMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            AI Planner
          </a></li>
          <li><a href="#chat" onClick={(e) => { e.preventDefault(); navigate('chat'); setMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Support Chat
          </a></li>
          <li><a href="#account" onClick={(e) => { e.preventDefault(); navigate('account'); setMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {user ? 'My Account' : 'Sign In'}
          </a></li>
          <li><a href="#cart" onClick={(e) => { e.preventDefault(); navigate('cart'); setMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Cart {itemCount > 0 && `(${itemCount})`}
          </a></li>
          <li><div onClick={() => { navigate('search'); setMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse All Products
          </div></li>
          {!user && (
            <li><a href="#admin-login" onClick={(e) => { e.preventDefault(); navigate('admin-login'); setMobileMenuOpen(false); }} style={{ color: 'var(--danger)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Portal
            </a></li>
          )}
        </ul>
      </div>

      {/* Main Content */}
      <main className="main-content" style={{ maxWidth: '1400px' }}>
        {renderPage()}
      </main>

      {/* Corporate Footer */}
      <footer style={{ background: '#f8f9fa', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-xl)', marginTop: 'auto' }}>
        <div className="responsive-footer-grid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--space-lg)' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--primary)"/>
                <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Aura</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: 'var(--space-md)' }}>
              Aura AI Hub is the leading B2B procurement platform for educational institutions across the globe. 
              We leverage artificial intelligence to provide the best infrastructure, labs, and NEP 2020 compliant software.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: '#888' }}>
              {/* Social Icons mock */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0' }}></div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0' }}></div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0' }}></div>
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>Get to Know Us</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li><a href="#careers" onClick={(e) => { e.preventDefault(); navigate('careers'); }} style={{ color: 'inherit' }}>Careers</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); navigate('about'); }} style={{ color: 'inherit' }}>About Aura</a></li>
              <li><a href="#investor-relations" onClick={(e) => { e.preventDefault(); navigate('investor-relations'); }} style={{ color: 'inherit' }}>Investor Relations</a></li>
              <li><a href="#sustainability" onClick={(e) => { e.preventDefault(); navigate('sustainability'); }} style={{ color: 'inherit' }}>Sustainability</a></li>
              <li><a href="#admin-login" onClick={() => navigate('admin-login')} style={{ color: 'var(--danger)', fontWeight: 600 }}>Employee Login</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>B2B Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li><a href="#recommend" onClick={() => navigate('recommend')} style={{ color: 'inherit' }}>AI Setup Planner</a></li>
              <li><a href="#chat" onClick={() => navigate('chat')} style={{ color: 'inherit' }}>Consultant Bot</a></li>
              <li><a href="#bulk-purchasing" onClick={(e) => { e.preventDefault(); navigate('bulk-purchasing'); }} style={{ color: 'inherit' }}>Bulk Purchasing</a></li>
              <li><a href="#institutional-credit" onClick={(e) => { e.preventDefault(); navigate('institutional-credit'); }} style={{ color: 'inherit' }}>Institutional Credit</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>Let Us Help You</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li><a href="#account" onClick={() => navigate('account')} style={{ color: 'inherit' }}>Your Account</a></li>
              <li><a href="#account" onClick={() => navigate('account')} style={{ color: 'inherit' }}>Your Orders</a></li>
              <li><a href="#shipping-policies" onClick={(e) => { e.preventDefault(); navigate('shipping-policies'); }} style={{ color: 'inherit' }}>Shipping Rates & Policies</a></li>
              <li><a href="#returns" onClick={(e) => { e.preventDefault(); navigate('returns'); }} style={{ color: 'inherit' }}>Returns & Replacements</a></li>
              <li><a href="#chat" onClick={() => navigate('chat')} style={{ color: 'inherit' }}>Help Center</a></li>
            </ul>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            © {new Date().getFullYear()} Aura Inc. or its affiliates.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Intelligent Enterprise Procurement
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
