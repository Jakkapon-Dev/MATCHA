/**
 * In-memory filtering, sorting, and pagination for product lists.
 * Pure helper preserving existing catalog fallback behavior.
 *
 * @param {Array<object>} products - The source array of product objects
 * @param {object} [query={}] - Filter and pagination options
 * @returns {{
 *   products: Array<object>,
 *   pagination: {
 *     total: number,
 *     page: number,
 *     totalPages: number,
 *     limit: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   }
 * }}
 */
export function filterInMemoryProducts(products = [], query = {}) {
  const {
    category = 'ALL',
    season = 'ALL',
    search = '',
    sort = 'featured',
    color = '',
    fit = '',
    inStockOnly = 'false',
    minPrice = 0,
    maxPrice = 1000,
    page = 1,
    limit = 24
  } = query;

  let filtered = [...products];

  // 1. Category Filter
  if (category && category !== 'ALL') {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }

  // 2. Season Filter
  if (season && season !== 'ALL') {
    filtered = filtered.filter(p => p.season && p.season.toLowerCase() === season.toLowerCase());
  }

  // 3. Search Query
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.tag && p.tag.toLowerCase().includes(q))
    );
  }

  // 4. Color Filter
  if (color && color !== 'ALL') {
    filtered = filtered.filter(p => p.color && p.color.toLowerCase() === color.toLowerCase());
  }

  // 5. Fit Filter
  if (fit && fit !== 'ALL') {
    filtered = filtered.filter(p => p.fit && p.fit.toLowerCase() === fit.toLowerCase());
  }

  // 6. In-Stock Only Filter
  if (inStockOnly === 'true' || inStockOnly === true) {
    filtered = filtered.filter(p => p.inStock);
  }

  // 7. Price Range Filter
  const minP = parseFloat(minPrice) || 0;
  const maxP = parseFloat(maxPrice) || 1000;
  filtered = filtered.filter(p => p.price >= minP && p.price <= maxP);

  // 8. Sorting
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

  // 9. Pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedProducts = filtered.slice(startIndex, startIndex + limitNum);

  return {
    products: paginatedProducts,
    pagination: {
      total: totalItems,
      page: pageNum,
      totalPages,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  };
}
