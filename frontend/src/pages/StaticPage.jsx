import React from 'react';

const PAGE_CONTENT = {
  careers: {
    title: "Careers at Aura",
    subtitle: "Join the revolution in B2B educational procurement.",
    body: "At Aura AI Hub, we are building the future of institutional supply chains. We are always looking for passionate engineers, AI researchers, and supply chain experts to join our global team. We offer competitive compensation, comprehensive benefits, and the opportunity to shape the future of education."
  },
  about: {
    title: "About Aura",
    subtitle: "Intelligent Enterprise Procurement.",
    body: "Aura AI Hub was founded with a single mission: to streamline and revolutionize how educational institutions procure infrastructure. By leveraging cutting-edge AI for planning and recommendation, we eliminate the guesswork and ensure schools get exactly what they need, when they need it."
  },
  'investor-relations': {
    title: "Investor Relations",
    subtitle: "Fueling the future of B2B commerce.",
    body: "Aura is backed by leading venture capital firms. We are experiencing exponential growth as we scale our AI-driven procurement platform globally. For financial reports, SEC filings, and shareholder resources, please contact our investor relations department."
  },
  sustainability: {
    title: "Sustainability",
    subtitle: "Our commitment to the planet.",
    body: "We believe in sustainable supply chains. From optimizing delivery routes to prioritizing eco-friendly and refurbished educational equipment, Aura is committed to achieving net-zero carbon emissions across our entire fulfillment network by 2030."
  },
  'bulk-purchasing': {
    title: "Bulk Purchasing",
    subtitle: "Scale your procurement efficiently.",
    body: "Need to outfit an entire campus? Our bulk purchasing program offers steep volume discounts, dedicated account managers, and custom logistics planning for large-scale institutional orders. Contact our enterprise sales team for a custom quote."
  },
  'institutional-credit': {
    title: "Institutional Credit",
    subtitle: "Flexible financing for schools.",
    body: "We understand the budget cycles of educational institutions. Aura offers Net-30, Net-60, and Net-90 credit terms for qualifying public and private schools. Apply today to streamline your procurement process without immediate cash flow constraints."
  },
  'shipping-policies': {
    title: "Shipping Rates & Policies",
    subtitle: "Fast, reliable delivery.",
    body: "Aura operates a massive, automated logistics network. We offer free standard shipping on all institutional orders over $10,000. Expedited freight and specialized installation services are also available for smart classroom and robotics lab equipment."
  },
  'returns': {
    title: "Returns & Replacements",
    subtitle: "Hassle-free institutional returns.",
    body: "We stand by the quality of our products. If any equipment arrives damaged or fails to meet your institutional requirements, we offer a 30-day no-questions-asked return policy. Our dedicated support team will arrange for freight pickup directly from your campus."
  }
};

const StaticPage = ({ pageId }) => {
  const content = PAGE_CONTENT[pageId] || {
    title: "Page Not Found",
    subtitle: "We couldn't find what you were looking for.",
    body: "The page you requested does not exist or has been moved."
  };

  return (
    <div style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, #0f172a 100%)', 
        padding: '5rem 2rem 8rem', 
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {content.title}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', fontWeight: 500 }}>
            {content.subtitle}
          </p>
        </div>
      </div>

      {/* Content Card (Overlapping Hero) */}
      <div style={{ 
        maxWidth: '900px', 
        margin: '-5rem auto 0', 
        padding: '0 1.5rem' 
      }}>
        <div className="card" style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '3.5rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>Corporate Information</h2>
          </div>
          
          <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, #e2e8f0 0%, rgba(226, 232, 240, 0) 100%)', marginBottom: '2.5rem' }}></div>
          
          <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#475569', marginBottom: '3rem' }}>
            {content.body}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Need Immediate Help?</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', flex: 1 }}>Our AI Consultant is available 24/7 to assist you.</p>
              <a href="#chat" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>Talk to AI Support</a>
            </div>
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Manage Orders</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', flex: 1 }}>Track, return, or reorder your institutional equipment.</p>
              <a href="#account" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>Go to Account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
