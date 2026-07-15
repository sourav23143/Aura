import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
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
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isLogin ? 'Sign In' : 'Register Institution'}</h2>
      
      {error && <div style={{ color: 'white', background: 'var(--danger)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!isLogin && (
          <>
            <input required type="text" className="input" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input required type="text" className="input" placeholder="Institution Name" value={orgName} onChange={e => setOrgName(e.target.value)} />
          </>
        )}
        <input required type="email" className="input" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
        <input required type="password" className="input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
        {isLogin ? "Don't have an account? " : "Already registered? "}
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
          {isLogin ? 'Register here' : 'Sign in here'}
        </button>
      </p>
    </div>
  );
}
