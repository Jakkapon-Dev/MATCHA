import { productsData } from '../data/productsData';
import { API_ORIGIN, API_BASE } from './apiConfig';

// Where the API lives. In development this stays '/api' and Vite's proxy
// forwards it to the local server. A deployed build has no proxy, so the host
// supplies VITE_API_URL — the full origin of the backend, e.g.
// https://matcha-api.onrender.com — and requests go straight there.
const TOKEN_KEY = 'matcha_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token, remember = true) {
  try {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    if (token) {
      store.setItem(TOKEN_KEY, token);
      other.removeItem(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage can be unavailable in private mode; the session simply won't persist.
  }
}
// Second attempt when the first is refused by the network. It only makes sense
// while the API is on this machine, so a configured deployment skips it rather
// than sending a visitor's browser to its own localhost.
const DIRECT_API = API_ORIGIN ? null : 'http://localhost:5001/api';
const GUEST_KEY = 'matcha_guest_id';

// ตะกร้าของคนที่ยังไม่ล็อกอินต้องแยกใบกัน ไม่ใช่ใช้ 'guest' ร่วมกันทั้งโลก
function guestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = `guest-${crypto.randomUUID().replace(/-/g, '')}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    // Storage ปิดอยู่ (โหมดส่วนตัว) — ตะกร้าจะไม่ข้ามการรีเฟรช แต่ยังใช้งานได้
    return `guest-${Math.random().toString(36).slice(2, 14)}`;
  }
}

function mapHttpError(status, serverMessage) {
  console.warn(`[API] Request failed (${status}):`, serverMessage || 'No server message');

  if (status === 401) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (status === 403) {
    return 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้';
  }
  if (status === 404) {
    return serverMessage || 'ไม่พบข้อมูลที่ต้องการในระบบ';
  }
  if (status === 400) {
    return serverMessage || 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  }
  if (status === 405 || (status >= 500 && status <= 599)) {
    return 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง';
  }
  return serverMessage || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
}

async function fetchWithFallback(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-Guest-Id': guestId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const config = { ...options, headers };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (res.ok) {
      try {
        return await res.json();
      } catch (parseErr) {
        console.warn(`[API] JSON parse error on ${endpoint}:`, parseErr);
        throw new Error('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
      }
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(mapHttpError(res.status, errorData.message));
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to communicate')) {
      throw err;
    }
  }

  // Fallback to direct backend URL (local development only)
  if (!DIRECT_API) {
    throw new Error('ตอนนี้เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }

  try {
    const directRes = await fetch(`${DIRECT_API}${endpoint}`, config);
    if (directRes.ok) {
      try {
        return await directRes.json();
      } catch (parseErr) {
        console.warn(`[API] JSON parse error on ${DIRECT_API}${endpoint}:`, parseErr);
        throw new Error('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
      }
    }
    const errorData = await directRes.json().catch(() => ({}));
    throw new Error(mapHttpError(directRes.status, errorData.message));
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    console.warn(`[API] Network failure at ${endpoint}:`, err.message);
    throw new Error('ตอนนี้เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }
}

export const api = {
  getStoreConfig: () => fetchWithFallback('/store-config'),
  // Check backend server health status
  checkHealth: async () => {
    return fetchWithFallback('/health');
  },

  // Fetch sample items from backend
  getItems: async () => {
    return fetchWithFallback('/items');
  },

  // Product CRUD
  createProduct: async (productData) => {
    return fetchWithFallback('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: async (id, updateData) => {
    return fetchWithFallback(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  deleteProduct: async (id) => {
    return fetchWithFallback(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Orders CRUD
  getOrders: async () => {
    return fetchWithFallback('/orders');
  },

  createOrder: async (orderData, options = {}) => {
    const key = orderData?.idempotencyKey || orderData?.requestId;
    const headers = {};
    if (key) {
      headers['Idempotency-Key'] = key;
      headers['X-Request-Id'] = key;
    }
    return fetchWithFallback('/orders', {
      method: 'POST',
      headers: { ...headers, ...(options.headers || {}) },
      body: JSON.stringify(orderData)
    });
  },

  updateOrderStatus: async (id, updateData) => {
    return fetchWithFallback(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  },

  getOrderById: async (id) => {
    return fetchWithFallback(`/orders/${id}`);
  },

  // Cart CRUD — เจ้าของตะกร้ามาจาก token หรือ X-Guest-Id ไม่ใช่จากพารามิเตอร์
  // Hand the pre-sign-in basket over to the account (US-35).
  mergeGuestCart: async () => {
    return fetchWithFallback('/cart/merge', { method: 'POST' });
  },

  getCart: async () => {
    return fetchWithFallback('/cart');
  },

  addToCart: async (item) => {
    return fetchWithFallback('/cart', {
      method: 'POST',
      body: JSON.stringify({ item })
    });
  },

  updateCartItem: async (itemId, quantity) => {
    return fetchWithFallback(`/cart/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  deleteCartItem: async (itemId) => {
    return fetchWithFallback(`/cart/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
  },

  // Users CRUD
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithFallback(`/users${query ? `?${query}` : ''}`);
  },

  getUserById: async (id) => {
    return fetchWithFallback(`/users/${id}`);
  },

  login: async (email, password) => {
    return fetchWithFallback('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (payload) => {
    return fetchWithFallback('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  me: async () => {
    if (getToken() === 'demo-offline-token') {
      try {
        const saved = localStorage.getItem('matcha_user') || sessionStorage.getItem('matcha_user');
        if (saved) return { success: true, data: JSON.parse(saved) };
      } catch {}
      return { success: true, data: { id: 'demo-user', name: 'Demo User', email: 'demo@matcha.com', role: 'Member', isDemoSession: true } };
    }
    return fetchWithFallback('/auth/me');
  },

  createUser: async (userData) => {
    return fetchWithFallback('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (id, updateData) => {
    return fetchWithFallback(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  deleteUser: async (id) => {
    return fetchWithFallback(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Fetch categories with product counts
  getCategories: async () => {
    try {
      const res = await fetchWithFallback('/categories');
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn('Backend categories fetch failed, using local dataset fallback:', err);
    }

    const categoryCounts = productsData.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: 'ALL', name: 'All Products', count: productsData.length },
      { id: 'Tops', name: 'Tops & Knitwear', count: categoryCounts['Tops'] || 0 },
      { id: 'Bottoms', name: 'Bottoms & Denim', count: categoryCounts['Bottoms'] || 0 },
      { id: 'Outerwear', name: 'Outerwear & Coats', count: categoryCounts['Outerwear'] || 0 },
      { id: 'Shoes', name: 'Shoes & Footwear', count: categoryCounts['Shoes'] || 0 },
      { id: 'Accessories', name: 'Accessories & Bags', count: categoryCounts['Accessories'] || 0 }
    ];
  },

  // Fetch filtered & paginated products
  getProducts: async (params = {}, { allowFallback = true } = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

    try {
      const res = await fetchWithFallback(endpoint);
      if (res && res.data) return res;
    } catch (err) {
      console.warn('Backend products fetch failed, using local filtering fallback:', err);
      if (!allowFallback) throw err;
    }

    // Local in-browser filtering fallback
    let filtered = [...productsData];
    const {
      category = 'ALL',
      season = 'ALL',
      search = '',
      sort = 'featured',
      color = '',
      fit = '',
      inStockOnly = false,
      minPrice = 0,
      maxPrice = 1000,
      page = 1,
      limit = 24
    } = params;

    if (category && category !== 'ALL') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (season && season !== 'ALL') {
      filtered = filtered.filter(p => p.season && p.season.toLowerCase() === season.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    if (color && color !== 'ALL') {
      filtered = filtered.filter(p => p.color.toLowerCase().includes(color.toLowerCase()));
    }

    if (fit && fit !== 'ALL') {
      filtered = filtered.filter(p => p.fit && p.fit.toLowerCase().includes(fit.toLowerCase()));
    }

    if (inStockOnly) {
      filtered = filtered.filter(p => p.inStock);
    }

    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      availableFilters: {
        totalAll: productsData.length,
        priceMin: Math.min(...productsData.map(p => p.price)),
        priceMax: Math.max(...productsData.map(p => p.price))
      }
    };
  }
};

