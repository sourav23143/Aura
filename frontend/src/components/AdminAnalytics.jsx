import { CONFIG } from '../config';
import React, { useState } from 'react';

const AdminAnalytics = () => {
  const [question, setQuestion] = useState('How many products are in each category?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAsk = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('CONFIG.API_URL/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        if (data.query) setError(prev => prev + ' \\nQuery generated: ' + data.query);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>AI Analytics (NL2SQL)</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Ask a question in plain English. The AI agent will instantly convert it to SQL, run it against the database securely, and show you the results!
      </p>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <form onSubmit={handleAsk} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            placeholder="e.g. What is the total revenue by organization?"
            style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 2rem', fontWeight: 'bold' }}>
            {loading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>AI Explanation</h4>
            <p style={{ margin: 0, color: '#334155' }}>{result.explanation}</p>
          </div>

          <div style={{ background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generated SQL Query</div>
            <code style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{result.query}</code>
          </div>

          {result.data && result.data.length > 0 ? (
            <div style={{ background: 'white', borderRadius: '8px', overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    {Object.keys(result.data[0]).map(key => (
                      <th key={key} style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{ padding: '1rem' }}>
                          {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(2) : val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div style={{ background: 'white', padding: '2rem', textAlign: 'center', borderRadius: '8px', color: '#64748b' }}>
               No data returned for this query.
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
