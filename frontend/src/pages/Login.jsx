import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ adminMode = false }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(adminMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let success = false;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(email, password, fullName, orgName);
    }
    
    if (!success) {
      setError(isLogin ? 'Invalid credentials' : 'Registration failed (email may be taken)');
    } else {
      if (isAdmin) {
        window.location.hash = 'admin';
      } else {
        window.location.hash = 'home';
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: isAdmin ? '#f8fafc' : 'white', border: isAdmin ? '1px solid #cbd5e1' : 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--danger)' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>}
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: isAdmin ? '#0f172a' : 'inherit' }}>
        {isAdmin ? 'Admin Portal Login' : (isLogin ? 'Sign In' : 'Register Institution')}
      </h2>
      
      {error && <div style={{ color: 'white', background: 'var(--danger)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!isLogin && !isAdmin && (
          <>
            <input required type="text" className="input" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input required type="text" className="input" placeholder="Institution Name" value={orgName} onChange={e => setOrgName(e.target.value)} />
          </>
        )}
        <input required type="email" className="input" placeholder={isAdmin ? "Admin Email" : "Email Address"} value={email} onChange={e => setEmail(e.target.value)} />
        <input required type="password" className="input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', background: isAdmin ? '#0f172a' : '' }}>
          {isLogin || isAdmin ? 'Secure Login' : 'Create Account'}
        </button>
      </form>
      
      {!isAdmin && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLogin ? 'Register here' : 'Sign in here'}
          </button>
        </p>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <button 
          onClick={() => { setIsAdmin(!isAdmin); setIsLogin(true); setError(''); window.location.hash = isAdmin ? 'account' : 'admin-login'; }} 
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
        >
          {isAdmin ? 'Return to Customer Sign In' : 'Are you an administrator? Log in here.'}
        </button>
      </div>
    </div>
  );
}
