const API_BASE = 'http://localhost:8000';

export const api = {
  // ─── Search ────────────────────────────────────
  async search(query, options = {}) {
    const res = await fetch(`${API_BASE}/api/search/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: options.topK || 5,
        category: options.category || null,
        use_ai_summary: options.useSummary !== false,
      }),
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
  },

  // ─── Agent Search ──────────────────────────────
  async agentSearch(query) {
    const res = await fetch(`${API_BASE}/api/search/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: 5, use_ai_summary: true }),
    });
    if (!res.ok) throw new Error(`Agent search failed: ${res.status}`);
    return res.json();
  },

  // ─── Chat (REST) ──────────────────────────────
  async chat(message, sessionId = null) {
    const res = await fetch(`${API_BASE}/api/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, stream: false }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return res.json();
  },

  // ─── Recommendations ──────────────────────────
  async recommend(profile) {
    const res = await fetch(`${API_BASE}/api/recommend/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(`Recommend failed: ${res.status}`);
    return res.json();
  },

  // ─── Documents ────────────────────────────────
  async getDocuments(category = null) {
    const params = category ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE}/api/documents/${params}`);
    if (!res.ok) throw new Error(`Documents failed: ${res.status}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/api/documents/categories`);
    if (!res.ok) throw new Error(`Categories failed: ${res.status}`);
    return res.json();
  },

  // ─── Agent Monitoring ─────────────────────────
  async getAgentLogs(limit = 20) {
    const res = await fetch(`${API_BASE}/api/agents/logs?limit=${limit}`);
    if (!res.ok) throw new Error(`Agent logs failed: ${res.status}`);
    return res.json();
  },

  async getAgentStats() {
    const res = await fetch(`${API_BASE}/api/agents/stats`);
    if (!res.ok) throw new Error(`Agent stats failed: ${res.status}`);
    return res.json();
  },

  // ─── Health ───────────────────────────────────
  async health() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  },

  // ─── WebSocket URL ────────────────────────────
  getWsUrl(sessionId) {
    return `ws://localhost:8000/api/chat/ws/${sessionId}`;
  },
};
