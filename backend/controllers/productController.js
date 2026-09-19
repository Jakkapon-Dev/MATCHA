import mongoose from 'mongoose';
import productsData from '../data/products.js';
import Product from '../models/Product.js';

// Standard Display Names for Categories
export const CATEGORY_NAMES = {
  ALL: 'All Products',
  Tops: 'Tops & Knitwear',
  Bottoms: 'Bottoms & Denim',
  Outerwear: 'Outerwear & Coats',
  Shoes: 'Shoes & Footwear',
  Accessories: 'Accessories & Bags'
};

const categoryOrder = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

/**
 * GET /api/categories
 * Returns categories with product counts (Live MongoDB or Static Fallback)
 */
export async function getCategories(req, res) {
  try {
    if (mongoose.connection.readyState === 1) {
      const counts = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      const totalCount = await Product.countDocuments();
      const countMap = {};
      counts.forEach((c) => {
        if (c._id) countMap[c._id] = c.count;
      });

      const categories = [
        { id: 'ALL', name: 'All Products', count: totalCount }
      ];

      for (const id of categoryOrder) {
        if (countMap[id] !== undefined) {
          categories.push({
            id,
            name: CATEGORY_NAMES[id] || id,
            count: countMap[id]
          });
        }
      }

      for (const [catId, count] of Object.entries(countMap)) {
        if (!categoryOrder.includes(catId) && catId !== 'ALL') {
          categories.push({
            id: catId,
            name: CATEGORY_NAMES[catId] || catId,
            count
          });
        }
      }

      return res.json({ success: true, data: categories });
    }
  } catch (err) {
    console.warn('MongoDB categories query error, using static fallback:', err.message);
  }

  // Safe fallback to static productsData
  const categoryCounts = productsData.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categories = [
    { id: 'ALL', name: 'All Products', count: productsData.length },
    { id: 'Tops', name: 'Tops & Knitwear', count: categoryCounts['Tops'] || 0 },
    { id: 'Bottoms', name: 'Bottoms & Denim', count: categoryCounts['Bottoms'] || 0 },
    { id: 'Outerwear', name: 'Outerwear & Coats', count: categoryCounts['Outerwear'] || 0 },
    { id: 'Shoes', name: 'Shoes & Footwear', count: categoryCounts['Shoes'] || 0 },
    { id: 'Accessories', name: 'Accessories & Bags', count: categoryCounts['Accessories'] || 0 }
  ];

  res.json({ success: true, data: categories });
}

/**
 * GET /api/products
 * Full Catalog API with search, category, sort, price, inStock, and pagination
 */
export async function getProducts(req, res) {
  try {
    let {
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
    } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};

      if (category && category !== 'ALL') {
        filter.category = new RegExp(`^${category.trim()}$`, 'i');
      }

      if (season && season !== 'ALL') {
        filter.season = new RegExp(`^${season.trim()}$`, 'i');
      }

      if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');
        filter.$or = [
          { name: searchRegex },
          { id: searchRegex },
          { sku: searchRegex },
          { description: searchRegex },
          { color: searchRegex },
          { tag: searchRegex }
        ];
      }

      if (color && color !== 'ALL') {
        filter.color = new RegExp(`^${color.trim()}$`, 'i');
      }

      if (fit && fit !== 'ALL') {
        filter.fit = new RegExp(`^${fit.trim()}$`, 'i');
      }

      if (inStockOnly === 'true' || inStockOnly === true) {
        filter.inStock = true;
      }

      const minP = parseFloat(minPrice) || 0;
      const maxP = parseFloat(maxPrice) || 1000;
      filter.price = { $gte: minP, $lte: maxP };

      let sortObj = {};
      switch (sort) {
        case 'price-asc':
          sortObj = { price: 1 };
          break;
        case 'price-desc':
          sortObj = { price: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1, _id: -1 };
          break;
        case 'rating':
          sortObj = { rating: -1, _id: -1 };
          break;
        case 'featured':
        default:
          sortObj = { isFeatured: -1, rating: -1, reviewsCount: -1, createdAt: -1, _id: -1 };
          break;
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 24);
      const skip = (pageNum - 1) * limitNum;

      const [totalItems, paginatedProducts, stats] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
        Product.aggregate([
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
              totalAll: { $sum: 1 }
            }
          }
        ])
      ]);

      const totalPages = Math.ceil(totalItems / limitNum) || 1;
      const priceStats = stats[0] || { minPrice: 0, maxPrice: 1000, totalAll: totalItems };

      return res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          total: totalItems,
          page: pageNum,
          totalPages,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        availableFilters: {
          totalAll: priceStats.totalAll,
          priceMin: priceStats.minPrice,
          priceMax: priceStats.maxPrice
        }
      });
    }

    // Fallback: Local array filtering when MongoDB is offline
    let filtered = [...productsData];

    // 1. Category Filter
    if (category && category !== 'ALL') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // 2. Season Filter
    if (season && season !== 'ALL') {
      filtered = filtered.filter(p => p.season && p.season.toLowerCase() === season.toLowerCase());
    }

    // 3. Search Query
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

    // 4. Color Filter
    if (color && color !== 'ALL') {
      filtered = filtered.filter(p => p.color.toLowerCase() === color.toLowerCase());
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

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        total: totalItems,
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
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
}

/**
 * GET /api/products/:id
 * Single Product Detail API
 */
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const doc = await Product.findOne({
        $or: [
          { id: id },
          { sku: id.toUpperCase() },
          ...(isOid ? [{ _id: id }] : [])
        ]
      }).lean();

      if (doc) {
        return res.json({ success: true, data: doc });
      }
    }

    const localItem = productsData.find(p => p.id === id || p.sku === id);
    if (localItem) {
      return res.json({ success: true, data: localItem });
    }

    res.status(404).json({ success: false, message: `Product ${id} not found` });
  } catch (err) {
    console.error(`Error fetching product ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Failed to retrieve product' });
  }
}

/**
 * POST /api/products
 * Create Garment (Admin Protected)
 */
export async function createProduct(req, res) {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  try {
    const data = { ...req.body };
    if (!data.id && !data.sku) {
      data.id = `PROD-${Date.now().toString().slice(-6)}`;
    }
    if (data.stock !== undefined && data.quantity === undefined) {
      data.quantity = data.stock;
    }
    if (mongoose.connection.readyState === 1) {
      const product = new Product(data);
      const saved = await product.save();
      return res.status(201).json({ success: true, data: saved });
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/products/:id
 * Update Garment (Admin Protected)
 */
export async function updateProduct(req, res) {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.stock !== undefined && updates.quantity === undefined) {
      updates.quantity = updates.stock;
    }
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const updated = await Product.findOneAndUpdate(
        {
          $or: [
            { id: id },
            { sku: id.toUpperCase() },
            ...(isOid ? [{ _id: id }] : [])
          ]
        },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, data: updated });
      }
    }
    res.status(404).json({ success: false, message: 'Product not found' });
  } catch (err) {
    console.error(`Error updating product ${req.params.id}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/products/:id
 * Delete Garment (Admin Protected)
 */
export async function deleteProduct(req, res) {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const deleted = await Product.findOneAndDelete({
        $or: [
          { id: id },
          { sku: id.toUpperCase() },
          ...(isOid ? [{ _id: id }] : [])
        ]
      });
      if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (err) {
    console.error(`Error deleting product ${req.params.id}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
}

export default {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  CATEGORY_NAMES
};
