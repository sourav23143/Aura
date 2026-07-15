import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IconChart } from '../components/Icons';

export default function Monitor() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData, healthData] = await Promise.all([
        api.getAgentStats().catch(() => null),
        api.getAgentLogs(20).catch(() => null),
        api.health().catch(() => null),
      ]);
      setStats(statsData);
      setLogs(logsData);
      setHealth(healthData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="flex items-center" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)', display: 'flex' }}><IconChart size={28} /></span> Agent Monitor
            </h2>
            <p>Real-time visibility into AI agent decisions and performance</p>
          </div>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? <span className="spinner"></span> : '🔄'} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-lg" style={{ borderColor: 'var(--accent-tertiary)' }}>
          <p style={{ color: 'var(--accent-tertiary)' }}>⚠️ {error}</p>
          <p className="text-muted mt-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            Make sure the backend is running at http://localhost:8000
          </p>
        </div>
      )}

      {/* System Health */}
      {health && (
        <div className="card mb-lg">
          <h3 style={{ marginBottom: 'var(--space-md)' }}>System Health</h3>
          <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-sm">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: health.db_connected ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
              <span>Database</span>
            </div>
            <div className="flex items-center gap-sm">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: health.chroma_connected ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
              <span>ChromaDB</span>
            </div>
            <div className="flex items-center gap-sm">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: health.groq_connected ? 'var(--success)' : 'var(--accent-tertiary)', display: 'inline-block' }}></span>
              <span>Groq LLM</span>
            </div>
            <span className={`badge ${health.status === 'healthy' ? 'badge-green' : 'badge-orange'}`}>
              {health.status}
            </span>
            <span className="badge badge-blue">{health.version}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="stats-grid mb-lg">
          <div className="stat-card">
            <div className="stat-value">{stats.total_queries || 0}</div>
            <div className="stat-label">Total Queries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_latency_ms?.toFixed(0) || 0}ms</div>
            <div className="stat-label">Avg Latency</div>
          </div>
          {Object.entries(stats.intent_distribution || {}).map(([intent, count]) => (
            <div className="stat-card" key={intent}>
              <div className="stat-value">{count}</div>
              <div className="stat-label">{intent} queries</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Agent Logs */}
      {logs && logs.logs?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Recent Agent Activity</h3>
          <div className="flex flex-col gap-md">
            {logs.logs.map((log, i) => (
              <div
                key={i}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-sm" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                  <div className="flex items-center gap-sm">
                    <span className="badge badge-purple">{log.intent_detected || 'unknown'}</span>
                    <span className="badge badge-green">{log.latency_ms?.toFixed(0)}ms</span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)' }}>
                  <strong>Query:</strong> {log.query}
                </p>
                {/* Agent Flow */}
                <div className="agent-flow" style={{ padding: 'var(--space-sm)' }}>
                  {log.nodes_visited?.map((node, j) => (
                    <span key={j} style={{ display: 'contents' }}>
                      {j > 0 && <span className="agent-arrow">→</span>}
                      <div className="agent-node completed">{node}</div>
                    </span>
                  ))}
                </div>
                {log.response_preview && (
                  <p className="text-muted mt-md" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {log.response_preview.slice(0, 150)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats?.total_queries === 0 && (
        <div className="card text-center" style={{ padding: 'var(--space-3xl)' }}>
          <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}><IconChart size={48} /></div>
          <h3 style={{ color: 'var(--text-secondary)' }}>No data yet</h3>
          <p className="text-muted mt-md">
            Start using Search or Chat to see agent activity here.
          </p>
        </div>
      )}
    </div>
  );
}
