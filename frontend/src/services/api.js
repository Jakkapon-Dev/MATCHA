import { productsData } from '../data/productsData';

const API_BASE = '/api';
const DIRECT_API = 'http://localhost:5000/api';

async function fetchWithFallback(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (res.ok) return await res.json();
  } catch (err) {
    // try direct
  }

  // Fallback to direct backend URL
  try {
    const directRes = await fetch(`${DIRECT_API}${endpoint}`);
    if (directRes.ok) return await directRes.json();
  } catch (err) {
    // ignore
  }

  throw new Error(`Failed to communicate with backend at ${endpoint}`);
}

export const api = {
  // Check backend server health status
  checkHealth: async () => {
    return fetchWithFallback('/health');
  },

  // Fetch sample items from backend
  getItems: async () => {
    return fetchWithFallback('/items');
  },

  // Fetch categories with product counts
  getCategories: async () => {
    try {
      const res = await fetchWithFallback('/categories');
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn('Backend categories fetch failed, using local dataset fallback');
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
      { id: 'Accessories', name: 'Accessories & Bags', count: categoryCounts['Accessories'] || 0 }
    ];
  },

  // Fetch filtered & paginated products
  getProducts: async (params = {}) => {
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
      console.warn('Backend products fetch failed, using local filtering fallback');
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


