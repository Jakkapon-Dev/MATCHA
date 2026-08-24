const API_BASE = '/api';
const DIRECT_API = 'http://localhost:5000/api';

async function fetchWithFallback(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Relative API fetch failed for ${endpoint}, trying direct URL...`);
  }

  // Fallback to direct backend URL
  const directRes = await fetch(`${DIRECT_API}${endpoint}`);
  if (!directRes.ok) throw new Error(`Failed to communicate with backend at ${endpoint}`);
  return directRes.json();
}

export const api = {
  // Check backend server health status
  checkHealth: async () => {
    return fetchWithFallback('/health');
  },

  // Fetch sample items from backend
  getItems: async () => {
    return fetchWithFallback('/items');
  }
};


