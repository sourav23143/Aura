import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ id: '', title: '', category: '', price_usd: 0, image_url: '', inventory_qty: 10, content: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('CONFIG.API_URL/api/documents/?limit=100');
      const data = await res.json();
      setProducts(data.documents || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`CONFIG.API_URL/api/documents/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (product) => {
    const meta = typeof product.metadata_json === 'string' ? JSON.parse(product.metadata_json) : product.metadata_json;
    setFormData({
      id: product.id,
      title: product.title,
      category: product.category,
      price_usd: meta?.price_usd || 0,
      image_url: meta?.image_url || '',
      inventory_qty: meta?.inventory_qty !== undefined ? meta.inventory_qty : 10,
      content: product.content
    });
    setEditingProduct(product);
    setIsCreating(false);
  };

  const handleCreateClick = () => {
    setFormData({ id: '', title: '', category: '', price_usd: 0, image_url: '', inventory_qty: 10, content: '' });
    setEditingProduct(null);
    setIsCreating(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      id: isCreating ? formData.id : undefined,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      subcategory: '',
      tags: [],
      metadata_json: { 
        price_usd: Number(formData.price_usd),
        image_url: formData.image_url,
        inventory_qty: Number(formData.inventory_qty)
      }
    };

    try {
      if (isCreating) {
        const res = await fetch('CONFIG.API_URL/api/documents/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          alert(errData.detail || 'Failed to create product');
          return;
        }
      } else {
        const res = await fetch(`CONFIG.API_URL/api/documents/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          alert('Failed to update product');
          return;
        }
      }
      setEditingProduct(null);
      setIsCreating(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Inventory Management</h2>
        <button onClick={handleCreateClick} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          + Add New Product
        </button>
      </div>

      {(editingProduct || isCreating) ? (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h3>{isCreating ? 'Create Product' : 'Edit Product'}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="SKU / Product ID (e.g. b2b-101) - Optional, auto-generated if left blank" 
                value={formData.id} 
                onChange={e => setFormData({...formData, id: e.target.value})} 
                disabled={!isCreating}
                style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: !isCreating ? '#f1f5f9' : '#fff' }}
              />
              <input 
                type="text" 
                placeholder="Product Title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required
                style={{ flex: 2, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Category" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                required
                style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Price ($)</span>
                <input 
                  type="number" 
                  placeholder="Price ($)" 
                  value={formData.price_usd} 
                  onChange={e => setFormData({...formData, price_usd: e.target.value})} 
                  required
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Quantity</span>
                <input 
                  type="number" 
                  placeholder="Quantity" 
                  value={formData.inventory_qty} 
                  onChange={e => setFormData({...formData, inventory_qty: e.target.value})} 
                  required
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <input 
              type="text" 
              placeholder="Image URL (e.g. https://images.unsplash.com/...)" 
              value={formData.image_url} 
              onChange={e => setFormData({...formData, image_url: e.target.value})} 
              style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <textarea 
              placeholder="Product Description" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              required
              rows={4}
              style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setEditingProduct(null); setIsCreating(false); }} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      ) : null}

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>SKU</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Product Title</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Category</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Price</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Stock</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const meta = typeof p.metadata_json === 'string' ? JSON.parse(p.metadata_json) : (p.metadata_json || {});
              const stock = meta.inventory_qty !== undefined ? meta.inventory_qty : 10;
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.id ? p.id.toUpperCase() : 'N/A'}</td>
                  <td style={{ padding: '1rem' }}><strong>{p.title}</strong></td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{p.category}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 600 }}>${meta.price_usd?.toLocaleString() || '0'}</td>
                  <td style={{ padding: '1rem', color: stock <= 0 ? '#ef4444' : '#64748b', fontWeight: stock <= 0 ? '700' : 'normal' }}>
                    {stock} {stock <= 0 ? '(Out of Stock)' : ''}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleEditClick(p)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '1rem', fontWeight: 600 }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
