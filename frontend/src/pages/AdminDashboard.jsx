import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminInventory from '../components/AdminInventory';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminReviews from '../components/AdminReviews';
import AdminOrders from '../components/AdminOrders';

const AdminDashboard = ({ onNavigate }) => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Admin Login State
  const [email, setEmail] = useState('admin@auraai.com');
  const [password, setPassword] = useState('adminpassword123');
  const [loginError, setLoginError] = useState('');

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('CONFIG.API_URL/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      
      // Store token (handled by AuthContext in real app, but for now we'll mock the set)
      localStorage.setItem('token', data.access_token);
      // Let's reload to trigger AuthContext fetch, or just navigate to admin
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // If user is not admin, show login or denied access
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Admin Portal Login</h2>
        {loginError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{loginError}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontWeight: 'bold' }}>
            Secure Login
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} style={{ fontSize: '0.8rem', color: '#666' }}>
            ← Back to Store
          </a>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div style={{ display: 'flex', minHeight: '80vh', background: '#f8fafc', margin: '-1rem -1rem -4rem -1rem' }}>
      
      {/* Premium SaaS Sidebar */}
      <div style={{ width: '260px', background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.05)' }}>
        
        {/* Brand Header */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #1e293b' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7L12 12L22 7L12 2Z"></path><path d="M2 17L12 22L22 17"></path><path d="M2 12L12 17L22 12"></path></svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>Aura<span style={{ color: 'var(--primary)' }}>OS</span></h2>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Command Center</p>
          </div>
        </div>
        
        {/* User Profile Mini */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Administrator</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div style={{ padding: '0 1rem', flex: 1 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Main Menu</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            
            <li 
              onClick={() => setActiveTab('inventory')}
              onMouseOver={(e) => { if(activeTab !== 'inventory') e.currentTarget.style.background = '#1e293b' }}
              onMouseOut={(e) => { if(activeTab !== 'inventory') e.currentTarget.style.background = 'transparent' }}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', background: activeTab === 'inventory' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'inventory' ? 'var(--primary)' : '#cbd5e1', fontWeight: activeTab === 'inventory' ? 600 : 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              Inventory Management
            </li>
            
            <li 
              onClick={() => setActiveTab('analytics')}
              onMouseOver={(e) => { if(activeTab !== 'analytics') e.currentTarget.style.background = '#1e293b' }}
              onMouseOut={(e) => { if(activeTab !== 'analytics') e.currentTarget.style.background = 'transparent' }}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', background: activeTab === 'analytics' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'analytics' ? 'var(--primary)' : '#cbd5e1', fontWeight: activeTab === 'analytics' ? 600 : 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              AI Analytics (NL2SQL)
            </li>
            
            <li 
              onClick={() => setActiveTab('reviews')}
              onMouseOver={(e) => { if(activeTab !== 'reviews') e.currentTarget.style.background = '#1e293b' }}
              onMouseOut={(e) => { if(activeTab !== 'reviews') e.currentTarget.style.background = 'transparent' }}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', background: activeTab === 'reviews' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'reviews' ? 'var(--primary)' : '#cbd5e1', fontWeight: activeTab === 'reviews' ? 600 : 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Sentiment & Reviews
            </li>
            
            <li 
              onClick={() => setActiveTab('orders')}
              onMouseOver={(e) => { if(activeTab !== 'orders') e.currentTarget.style.background = '#1e293b' }}
              onMouseOut={(e) => { if(activeTab !== 'orders') e.currentTarget.style.background = 'transparent' }}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', background: activeTab === 'orders' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'orders' ? 'var(--primary)' : '#cbd5e1', fontWeight: activeTab === 'orders' ? 600 : 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Order Management
            </li>
          </ul>
        </div>
        
        {/* Logout Button */}
        <div style={{ padding: '1.5rem 1rem' }}>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            style={{ width: '100%', padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', background: 'transparent', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 600, fontSize: '0.9rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeTab === 'inventory' && <AdminInventory />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'reviews' && <AdminReviews />}
        {activeTab === 'orders' && <AdminOrders />}
      </div>

    </div>
  );
};

export default AdminDashboard;
