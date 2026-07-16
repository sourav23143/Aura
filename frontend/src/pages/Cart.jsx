import { CONFIG } from '../config';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IconCart } from '../components/Icons';

export default function Cart({ onNavigate }) {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        total_amount: cartTotal,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price_usd
        }))
      };

      const res = await fetch(`${CONFIG.API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCheckoutStep(3); // Success step
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || "Checkout failed. Are you logged in?");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeCheckout = () => {
    if (checkoutStep === 3) {
      clearCart();
      onNavigate('home');
    }
    setShowCheckout(false);
    setCheckoutStep(1);
  };

  if (cartItems.length === 0 && !showCheckout) {
    return (
      <div className="section-container" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)', background: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><IconCart size={48} /></div>
        <h2 style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
          Start exploring our marketplace or let the AI Setup Planner build a package for you.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('search')}>Explore Marketplace</button>
          <button className="btn btn-secondary glass-effect" onClick={() => onNavigate('recommend')}>Use Setup Planner</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container" style={{ position: 'relative' }}>
      <div className="section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', display: 'flex' }}><IconCart size={28} /></span> Your Procurement Cart</h2>
        <p>Review your selected infrastructure items before consulting with our AI Sales Engineer.</p>
      </div>

      <div className="responsive-cart-grid">
        
        {/* Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {cartItems.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md)' }}>
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: '#fff' }} 
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <span className="badge badge-purple">{item.category}</span>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Unit Price: ${item.price_usd?.toLocaleString()} | Qty:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ padding: '0 0.5rem', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ padding: '0 0.5rem', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({item.inventory_qty !== undefined ? item.inventory_qty : 10} available)</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  ${(item.price_usd * item.quantity).toLocaleString()}
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          
          {cartItems.length > 0 && (
            <div>
              <button 
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', marginTop: 'var(--space-md)' }}
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="card" style={{ height: 'fit-content', padding: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            Order Summary
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span>Subtotal ({cartItems.reduce((a, b) => a + b.quantity, 0)} items)</span>
            <span>${cartTotal.toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', color: 'var(--text-muted)' }}>
            <span>Estimated Tax & Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)',
            marginBottom: 'var(--space-xl)', fontSize: '1.25rem', fontWeight: 'bold' 
          }}>
            <span>Total Estimated Cost</span>
            <span>${cartTotal.toLocaleString()}</span>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}
            onClick={() => setShowCheckout(true)}
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Want to negotiate a bulk discount or check warranty details?
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => onNavigate('chat')}
            >
              💬 Talk to AI Consultant
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '2rem', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
            {checkoutStep < 3 && (
              <button 
                onClick={closeCheckout}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}
              >
                &times;
              </button>
            )}

            {checkoutStep === 1 && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#111' }}>Secure Checkout</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>Total Amount:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>${cartTotal.toLocaleString()}</span>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep(2); }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Shipping Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <input required type="text" placeholder="First Name" className="input" />
                      <input required type="text" placeholder="Last Name" className="input" />
                    </div>
                    <input required type="text" placeholder="Institution / Company Name" className="input" style={{ width: '100%', marginBottom: '1rem' }} />
                    <input required type="text" placeholder="Address" className="input" style={{ width: '100%', marginBottom: '1rem' }} />
                  </div>
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {checkoutStep === 2 && (
              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#111' }}>Payment Details</h2>
                <form onSubmit={handleCheckout}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '1.5rem', background: '#f8fafc' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="radio" name="payment" defaultChecked style={{ accentColor: 'var(--primary)' }} /> 
                        Institutional Purchase Order (PO)
                      </label>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.5rem', marginLeft: '24px' }}>Net-30 terms available for approved educational institutions.</p>
                      <input type="text" placeholder="PO Number (Optional)" className="input" style={{ width: '100%', marginTop: '0.8rem', marginLeft: '24px', maxWidth: 'calc(100% - 24px)' }} />
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="radio" name="payment" style={{ accentColor: 'var(--primary)' }} /> 
                        Credit Card
                      </label>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCheckoutStep(1)} disabled={isProcessing}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.8rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }} disabled={isProcessing}>
                      {isProcessing ? <span className="spinner" style={{ width: '20px', height: '20px' }}></span> : `Complete Order ($${cartTotal.toLocaleString()})`}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {checkoutStep === 3 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem' }}>
                  ✓
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#111' }}>Order Confirmed!</h2>
                <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem' }}>
                  Your procurement order <strong>#PO-{Math.floor(100000 + Math.random() * 900000)}</strong> has been successfully placed. A confirmation email has been sent to your institution.
                </p>
                <button className="btn btn-primary" onClick={closeCheckout} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
