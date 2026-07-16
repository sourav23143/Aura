import { CONFIG } from '../config';
import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCart } from '../context/CartContext';
import FormattedText from '../components/FormattedText';
import { IconBot } from '../components/Icons';

export default function Chat() {
  const { cartItems, cartTotal, addToCart } = useCart();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesContainerRef = useRef(null);

  // Dynamic suggestions state
  const [suggestions, setSuggestions] = useState([
    'Does the AR Biology Lab comply with CBSE?',
    'I want to buy the items in my cart, can I get a discount?',
    'We need a complete STEM lab setup.'
  ]);

  const [productsDb, setProductsDb] = useState([]);

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
      .catch(err => console.error("Could not fetch product list", err));
  }, []);

  // Always use WebSockets for the seamless experience
  const ws = useWebSocket(sessionId);

  // Auto-connect WebSocket
  useEffect(() => {
    ws.connect();
    return () => ws.disconnect();
  }, []);

  // Auto-scroll
  const messages = ws.messages;
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Fetch dynamic suggestions when assistant finishes streaming
  useEffect(() => {
    if (!ws.isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        fetch('CONFIG.API_URL/api/chat/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ last_message: lastMsg.content })
        })
        .then(res => res.json())
        .then(data => {
          if (data.suggestions && Array.isArray(data.suggestions)) {
            const clean = data.suggestions
              .map(s => typeof s === 'string' ? s : (s?.question || s?.text || s?.suggestion || JSON.stringify(s)))
              .filter(Boolean);
            if (clean.length > 0) setSuggestions(clean);
          }
        })
        .catch(err => console.error("Could not fetch dynamic suggestions", err));
      }
    }
  }, [ws.isStreaming, messages]);

  // Typing Autocomplete
  useEffect(() => {
    if (input.trim().length < 3) return;
    
    const timeoutId = setTimeout(() => {
      fetch('CONFIG.API_URL/api/chat/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      })
      .then(res => res.json())
      .then(data => {
        if (data.suggestions && Array.isArray(data.suggestions)) {
          const clean = data.suggestions
            .map(s => typeof s === 'string' ? s : (s?.question || s?.text || s?.suggestion || JSON.stringify(s)))
            .filter(Boolean);
          if (clean.length > 0) setSuggestions(clean);
        }
      })
      .catch(err => console.error("Could not fetch autocomplete", err));
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const originalInput = input;
    let messageToSend = originalInput;
    setInput('');

    // Inject cart context
    if (cartItems.length > 0) {
      const cartSummary = cartItems.map(i => `${i.title} (x${i.quantity})`).join(', ');
      messageToSend = `[SYSTEM CONTEXT: The user currently has these items in their shopping cart: ${cartSummary}. Total price: $${cartTotal}.] \n\nUser Question: ${originalInput}`;
    }

    if (ws.isConnected) {
      ws.sendMessage(messageToSend, originalInput);
    } else {
      alert("Consultant is currently offline. Please try again later.");
    }
  };

  return (
    <div className="chat-layout">
      
      {/* Left Sidebar: Consultant Info */}
      <aside className="chat-sidebar">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)' }}>
            <IconBot size={40} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>Aura Consultant</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
            Online now
          </p>
        </div>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 'var(--space-sm)' }}>How can I help?</h3>
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
            I am your dedicated AI Sales Engineer. Ask me about product specifications, bulk pricing discounts, warranty policies, or curriculum compliance.
          </p>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 'var(--space-sm)' }}>Suggested Topics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suggestions.map((q, i) => (
              <button
                key={i}
                style={{ textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', cursor: 'pointer', color: '#0f172a', transition: 'border-color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                onClick={() => setInput(q)}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Side: Chat Window */}
      <div className="chat-main">
        
        {/* Chat Header */}
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Consultation</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Session ID: {sessionId}</p>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: ws.isConnected ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', background: ws.isConnected ? '#dcfce7' : '#fee2e2', padding: '6px 14px', borderRadius: '24px' }}>
            <span className={ws.isConnected ? 'pulse-dot' : ''} style={{ width: '8px', height: '8px', background: ws.isConnected ? 'var(--success)' : 'var(--danger)', borderRadius: '50%', display: 'inline-block' }}></span>
            {ws.isConnected ? 'Live Sync' : 'Offline'}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages-container" ref={messagesContainerRef}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <p>Type a message below to start the conversation.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '1rem', 
                borderRadius: '12px', 
                background: msg.role === 'user' ? 'var(--primary)' : '#f1f5f9',
                color: msg.role === 'user' ? 'white' : '#0f172a',
                borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: msg.role === 'user' ? '12px' : '2px',
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}>
                <FormattedText text={msg.content} />
                
                {/* Inline Context-Aware Product Suggestions */}
                {msg.role === 'assistant' && !msg.streaming && (
                  (() => {
                    // Try to match any product title in the response (simple heuristic)
                    const foundProducts = productsDb.filter(p => msg.content.toLowerCase().includes(p.title.toLowerCase()) || msg.content.toLowerCase().includes(p.id.toLowerCase()));
                    if (foundProducts.length > 0) {
                      return (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Products</p>
                          {foundProducts.slice(0, 2).map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              {p.image_url && <img src={p.image_url} alt={p.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{p.title}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>${p.price_usd}</p>
                              </div>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                                onClick={() => addToCart(p)}
                              >
                                + Cart
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {msg.streaming && <span className="loading-dots" style={{ marginLeft: '8px' }}></span>}
              </div>
              {msg.agent && (
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                  Handled by <strong>{msg.agent}</strong> agent
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderTop: '1px solid var(--border-subtle)', background: 'white' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <input
              type="text"
              className="input"
              placeholder="Type your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={ws.isStreaming}
              style={{ flex: 1, borderRadius: '24px', paddingLeft: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={ws.isStreaming || !input.trim()}
              style={{ borderRadius: '24px', padding: '0 2rem', fontWeight: 600 }}
            >
              {ws.isStreaming ? <span className="spinner" style={{ width: '20px', height: '20px' }}></span> : 'Send'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
