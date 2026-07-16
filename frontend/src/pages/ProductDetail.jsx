import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function ProductDetail({ productId, onNavigate }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!productId) return;
    
    // Fetch product details
    fetch(`${CONFIG.API_URL}/api/documents/${productId}`)
      .then(res => res.json())
      .then(data => {
        let meta = {};
        if (data.metadata_json) {
           meta = typeof data.metadata_json === 'string' ? JSON.parse(data.metadata_json) : data.metadata_json;
        }
        setProduct({ ...data, meta });
      })
      .catch(err => console.error("Error fetching product:", err));

    // Fetch product reviews
    fetch(`${CONFIG.API_URL}/api/reviews/${productId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      });
  }, [productId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to write a review.");
      onNavigate('account');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          user_email: user.email,
          rating: newReview.rating,
          content: newReview.content
        })
      });
      
      const savedReview = await response.json();
      setReviews([savedReview, ...reviews]);
      setNewReview({ rating: 5, content: '' });
    } catch (err) {
      console.error("Error posting review", err);
      } finally {
        setIsSubmitting(false);
      }
    };
  
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/reviews/${reviewId}?user_email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to delete review");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting review");
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading product details...</div>;
  if (!product) return <div style={{ padding: '4rem', textAlign: 'center' }}>Product not found.</div>;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-xl)' }}>
      {/* Product Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', marginBottom: 'var(--space-3xl)' }}>
        
        {/* Left: Image */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={product.meta.image_url || 'https://placehold.co/600x600/1e293b/ffffff?text=No+Image'} 
            alt={product.title} 
            style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'multiply' }}
          />
        </div>

        {/* Right: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-purple">{product.category}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {product.id.toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1 }}>{product.title}</h1>
          
          <a href="#reviews" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', color: '#fbbf24', fontSize: '1.2rem' }}>
              {'★'.repeat(Math.round(averageRating || 0))}{'☆'.repeat(5 - Math.round(averageRating || 0))}
            </div>
            <span style={{ fontWeight: 600 }}>{averageRating || 'No ratings'}</span>
            <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>({reviews.length} reviews)</span>
          </a>
          
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: 'var(--space-md)' }}>
            ${(product.meta.price_usd || 0).toLocaleString()}
          </div>
          
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {product.content}
          </p>

          <div style={{ marginTop: 'var(--space-lg)' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: addedToCart ? 'var(--success)' : 'var(--primary)', transition: 'background-color 0.3s ease' }}
              onClick={() => {
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: product.meta.price_usd || 0,
                  image_url: product.meta.image_url || ''
                });
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2000);
              }}
            >
              {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 'var(--space-xl)' }}>Customer Reviews</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-2xl)' }}>
          
          {/* Write a Review */}
          <div className="card glass-effect" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Write a Review</h3>
            {user ? (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rating</label>
                <select 
                  className="input" 
                  value={newReview.rating} 
                  onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Terrible</option>
                </select>
                
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 'var(--space-sm)' }}>Review</label>
                <textarea 
                  className="input" 
                  rows="4" 
                  placeholder="What did you like or dislike?"
                  value={newReview.content}
                  onChange={e => setNewReview({...newReview, content: e.target.value})}
                  required
                ></textarea>
                
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Please sign in to write a review.</p>
                <button className="btn btn-secondary" onClick={() => onNavigate('account')}>Sign In</button>
              </div>
            )}
          </div>

          {/* List of Reviews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', color: '#fbbf24', fontSize: '1rem', marginBottom: '4px' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {review.user_email.split('@')[0].substring(0, 2)}***@{review.user_email.split('@')[1]}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                      {user && user.email === review.user_email && (
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px' }}>
                    {review.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
