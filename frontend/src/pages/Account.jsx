import { CONFIG } from '../config';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { IconBriefcase, IconLaptop, IconTarget } from '../components/Icons';

export default function Account({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // States for API data
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  
  // Form states
  const [profile, setProfile] = useState({
    institution: '',
    type: '',
    contact: '',
    email: ''
  });
  const [settings, setSettings] = useState({
    twoFactor: true,
    emailQuotes: true,
    emailPromos: false,
    language: 'en'
  });

  useEffect(() => {
    if (user) {
      setProfile({
        institution: user.organization?.name || '',
        type: user.organization?.type || '',
        contact: user.full_name || '',
        email: user.email || ''
      });
      if (user.organization?.settings) {
        setSettings({ ...settings, ...user.organization.settings });
      }
      
      const token = localStorage.getItem('token');
      // Fetch Orders
      fetch('CONFIG.API_URL/api/orders/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(console.error);

      // Fetch Quotes
      fetch('CONFIG.API_URL/api/quotes/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setQuotes(data))
      .catch(console.error);
    }
  }, [user]);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('CONFIG.API_URL/api/auth/profile', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        full_name: profile.contact,
        organization_name: profile.institution,
        organization_type: profile.type
      })
    });
    if (res.ok) {
      alert(t("Profile updated successfully!") || "Profile updated successfully!");
      setIsEditingProfile(false);
      // Ideally refresh auth context here to get new names
      window.location.reload();
    } else {
      alert("Failed to update profile.");
    }
  };

  const saveSettings = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('CONFIG.API_URL/api/auth/settings', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ settings })
    });
    if (res.ok) {
      i18n.changeLanguage(settings.language);
      alert(t("Settings saved to database!") || `Settings saved to database!\nLanguage: ${settings.language}\n2FA: ${settings.twoFactor}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0 }}>{t("My Account")}</h1>
        <button className="btn btn-secondary" onClick={() => { logout(); clearCart(); onNavigate('home'); }}>{t("Sign Out")}</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'profile', label: t('Organization Profile'), icon: <IconBriefcase size={20} /> },
            { id: 'orders', label: t('Order History'), icon: <IconLaptop size={20} /> },
            { id: 'quotes', label: t('Saved Quotes'), icon: <IconTarget size={20} /> },
            { id: 'settings', label: t('Settings'), icon: <IconBriefcase size={20} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '1rem', border: 'none', borderRadius: '8px',
                background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass-effect" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', minHeight: '500px' }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                  {t('Organization Profile')}
                </h2>
                {!isEditingProfile ? (
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', background: '#e2e8f0', color: '#334155', border: 'none' }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={saveProfile}>Save Changes</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('Institution Name')}</label>
                  <input type="text" className="input" value={profile.institution} onChange={e => setProfile({...profile, institution: e.target.value})} readOnly={!isEditingProfile} style={{ width: '100%', background: isEditingProfile ? 'white' : '#f8fafc', border: isEditingProfile ? '1px solid var(--primary)' : '' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('Account Type')}</label>
                  {isEditingProfile ? (
                    <select className="input" value={profile.type} onChange={e => setProfile({...profile, type: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid var(--primary)' }}>
                      <option value="School District">School District</option>
                      <option value="University">University</option>
                      <option value="B2B Enterprise">B2B Enterprise</option>
                      <option value="Individual Teacher">Individual Teacher</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <input type="text" className="input" value={profile.type || 'N/A'} readOnly style={{ width: '100%', background: '#f8fafc' }} />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('Primary Contact')}</label>
                  <input type="text" className="input" value={profile.contact} onChange={e => setProfile({...profile, contact: e.target.value})} readOnly={!isEditingProfile} style={{ width: '100%', background: isEditingProfile ? 'white' : '#f8fafc', border: isEditingProfile ? '1px solid var(--primary)' : '' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('Contact Email')}</label>
                  <input type="email" className="input" value={profile.email} readOnly style={{ width: '100%', background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} title="Email cannot be changed" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                Order History
              </h2>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <p>No past orders found for this institution.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('home')}>Start Shopping</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Order #{order.id.slice(0, 8)}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date: {new Date(order.created_at).toLocaleDateString()} • Status: <span style={{ color: 'var(--success)' }}>{order.status}</span></p>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${order.total_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                Saved Quotes
              </h2>
              {quotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <p>No saved quotes yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('recommend')}>Generate Quote with AI</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {quotes.map(quote => (
                    <div key={quote.id} style={{ padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{quote.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Created: {new Date(quote.created_at).toLocaleDateString()} • Valid until: {new Date(quote.expires_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>${quote.total_amount.toLocaleString()}</div>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => alert(`Downloading Quote PDF: ${quote.id}`)}>View Quote</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                {t('Account Settings')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{t('Security')}</h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.twoFactor} onChange={e => setSettings({...settings, twoFactor: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '0.9rem' }}>Enable Two-Factor Authentication (2FA)</span>
                  </label>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{t('Notifications')}</h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.emailQuotes} onChange={e => setSettings({...settings, emailQuotes: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '0.9rem' }}>Email me when a new quote is generated</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.emailPromos} onChange={e => setSettings({...settings, emailPromos: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '0.9rem' }}>Email me promotional offers and clearance deals</span>
                  </label>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{t('Language Preference')}</h4>
                  <select className="input" style={{ width: '100%', maxWidth: '300px' }} value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})}>
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={saveSettings}>{t('Save Settings')}</button>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>{t('Danger Zone')}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button 
                    className="btn btn-secondary" 
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to completely delete your account? This action cannot be undone.')) {
                        const token = localStorage.getItem('token');
                        try {
                          const res = await fetch('CONFIG.API_URL/api/auth/me', {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) {
                            logout();
                            clearCart();
                            onNavigate('home');
                            alert('Your account has been deleted successfully.');
                          } else {
                            alert('Failed to delete account.');
                          }
                        } catch (err) {
                          console.error('Failed to delete account', err);
                          alert('Failed to delete account.');
                        }
                      }
                    }}
                  >
                    {t('Delete Account')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
