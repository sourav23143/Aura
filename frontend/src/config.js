// Environment-aware configurations
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Convert http/https API URL to ws/wss URL dynamically
const getWsUrl = (sessionId) => {
  const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
  const cleanUrl = API_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${cleanUrl}/api/chat/ws/${sessionId}`;
};

export const CONFIG = {
  API_URL,
  WS_URL: getWsUrl,
};
