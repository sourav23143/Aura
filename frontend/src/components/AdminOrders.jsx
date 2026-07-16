import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Order Management</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        View all B2B orders across all organizations.
      </p>

      {orders.length === 0 ? (
        <div style={{ background: 'white', padding: '2rem', textAlign: 'center', borderRadius: '8px', color: '#64748b' }}>
          No orders have been placed yet.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Order ID</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Organization</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{o.id.substring(0, 8)}...</td>
                  <td style={{ padding: '1rem', color: '#1e293b', fontSize: '0.9rem', fontWeight: 500 }}>{o.organization_name}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={o.status} 
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{ 
                        background: o.status === 'Confirmed' ? '#dcfce7' : (o.status === 'Processing' ? '#fef9c3' : (o.status === 'Shipped' ? '#dbeafe' : '#e0e7ff')), 
                        color: o.status === 'Confirmed' ? '#15803d' : (o.status === 'Processing' ? '#854d0e' : (o.status === 'Shipped' ? '#1d4ed8' : '#3730a3')), 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#111' }}>
                    ${o.total_amount?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
