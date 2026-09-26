import mongoose from 'mongoose';
import productsData from '../data/products.js';
import Product, { ONE_SIZE } from '../models/Product.js';
import { escapeRegex } from '../utils/regex.js';
import { filterInMemoryProducts } from '../utils/productFilters.js';

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

/* `quantity` exists on old seed rows, but current inventory writes maintain
   `stock` and (when applicable) `sizeStock`. Always present one canonical
   number to clients so a stale legacy field cannot make the catalogue,
   lookbook, or admin UI contradict the stock that checkout reserves. */
export function availableStock(product) {
  const buckets = Array.isArray(product?.sizeStock) ? product.sizeStock : [];
  if (buckets.length) {
    return buckets.reduce((total, row) => total + (Number(row?.stock) || 0), 0);
  }
  return Number(product?.stock ?? product?.quantity ?? 0) || 0;
}

export function presentProduct(product) {
  const stock = availableStock(product);
  return { ...product, stock, quantity: stock, inStock: stock > 0 };
}

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
        const escaped = escapeRegex(search.trim());
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
        data: paginatedProducts.map(presentProduct),
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
    const result = filterInMemoryProducts(productsData, {
      category,
      season,
      search,
      sort,
      color,
      fit,
      inStockOnly,
      minPrice,
      maxPrice,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.products.map(presentProduct),
      pagination: result.pagination,
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
        return res.json({ success: true, data: presentProduct(doc) });
      }
    }

    const localItem = productsData.find(p => p.id === id || p.sku === id);
    if (localItem) {
      return res.json({ success: true, data: presentProduct(localItem) });
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
/* `quantity` is what the admin console and several older callers send; `stock`
   is what the schema stores. Accept either, write the one that exists. */
function normaliseStock(payload) {
  if (payload.quantity !== undefined) {
    if (payload.stock === undefined) payload.stock = payload.quantity;
    delete payload.quantity;
  }
  return payload;
}

export async function createProduct(req, res) {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  try {
    const data = { ...req.body };
    if (!data.id && !data.sku) {
      data.id = `PROD-${Date.now().toString().slice(-6)}`;
    }
    /* The stock count is normalised onto `stock`, which is the field the
       Product schema declares. This used to copy the other way — stock onto
       quantity — and the schema has no `quantity` path, so with strict mode on
       Mongoose dropped it before the write. The copy never reached the
       database and never could. */
    normaliseStock(data);
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
    /* Restocking from the admin console sends `quantity` and nothing else, so
       the old mapping — which only fired when `stock` was present — never ran,
       and `quantity` went into $set to be dropped by the schema. The update
       matched a product, changed none of its fields and answered
       `success: true`. Measured before this fix: PUT {quantity: 53} against a
       product holding 50 returned success and left it at 50, so every restock
       an administrator performed was lost on the next reload. */
    normaliseStock(updates);

    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const selector = {
        $or: [
          { id: id },
          { sku: id.toUpperCase() },
          ...(isOid ? [{ _id: id }] : [])
        ]
      };

      /* A migrated product's stock lives in `sizeStock`; `stock` is only the
         sum of it, kept in step by a pre-validate hook. findOneAndUpdate does
         not run that hook, so writing `stock` here set a total that no size
         bucket agreed with: the admin table showed the new number, orders kept
         drawing on the old per-size figures, and the next full save recomputed
         the total back down. Four production rows drifted this way
         (LOOK-01-CARGO, LOOK-05-CARGO, LOOK-06-SHIRT, LOOK-06-VEST: total 12
         against 50 in the buckets).

         Restocking a migrated product has to name a size, which is what
         PATCH /api/products/:id/restock is for. */
      if (updates.stock !== undefined) {
        const current = await Product.findOne(selector, 'sizeStock').lean();
        if (Array.isArray(current?.sizeStock) && current.sizeStock.length > 0) {
          return res.status(400).json({
            success: false,
            code: 'SIZE_STOCK_REQUIRED',
            message: 'This product tracks stock per size. Use the per-size restock endpoint instead of setting a total.',
            sizes: current.sizeStock.map(row => row.size)
          });
        }
      }

      const updated = await Product.findOneAndUpdate(
        selector,
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
 * PATCH /api/products/:id/restock
 * Adjust stock (Admin Protected)
 *
 * Takes a signed `delta` and, for a product that tracks stock per size, the
 * `size` the delta applies to. The adjustment is a single conditional
 * findOneAndUpdate on the size bucket, the same shape order placement uses, so
 * a restock racing an order cannot drive a bucket below zero and cannot lose
 * either write. `stock` moves by the same amount in the same operation, which
 * is what keeps the derived total agreeing with the buckets it sums.
 */
export async function restockProduct(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  }
  try {
    const { id } = req.params;
    const raw = req.body?.delta !== undefined ? req.body.delta : req.body?.quantity;
    const delta = Number(raw);
    if (!Number.isInteger(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'Restock amount must be a non-zero whole number' });
    }

    const isOid = mongoose.Types.ObjectId.isValid(id);
    const selector = {
      $or: [
        { id: id },
        { sku: id.toUpperCase() },
        ...(isOid ? [{ _id: id }] : [])
      ]
    };

    const product = await Product.findOne(selector, 'sizeStock stock').lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    /* `stock` and `inStock` are both derived, and both are settled from the
       document the write actually produced rather than from the one read a
       moment earlier — an order placed in between would make a guess from the
       stale figures wrong, and a product wrongly marked out of stock vanishes
       from the shop.

       The $inc above moves the total by the same delta as the bucket, so a
       product whose figures already agreed still agrees afterwards. This also
       repairs one that did not: the buckets win, because they are what order
       placement decrements under a condition that refuses to go below zero, so
       they are the only figure that has ever reflected the shelf. */
    const settleDerived = async (doc) => {
      const plain = doc.toObject ? doc.toObject() : { ...doc };
      const buckets = Array.isArray(plain.sizeStock) ? plain.sizeStock : [];
      const total = buckets.length
        ? buckets.reduce((sum, row) => sum + (Number(row.stock) || 0), 0)
        : Math.max(0, Number(plain.stock) || 0);
      const inStock = total > 0;
      if (plain.stock === total && plain.inStock === inStock) return plain;
      await Product.updateOne({ _id: plain._id }, { $set: { stock: total, inStock } });
      return { ...plain, stock: total, inStock };
    };

    const buckets = Array.isArray(product.sizeStock) ? product.sizeStock : [];

    // Not migrated: there is only a total, and it is the authoritative figure.
    if (buckets.length === 0) {
      const updated = await Product.findOneAndUpdate(
        { ...selector, ...(delta < 0 ? { stock: { $gte: -delta } } : {}) },
        { $inc: { stock: delta } },
        { new: true }
      );
      if (!updated) {
        return res.status(409).json({ success: false, message: 'Not enough stock to remove that many units' });
      }
      return res.json({ success: true, data: await settleDerived(updated) });
    }

    /* A garment sold without sizes keeps everything in the single ONE bucket,
       so there is nothing to choose and asking would be a question with one
       answer. Naming it explicitly still works. */
    const onlyOneSize = buckets.length === 1 && buckets[0].size === ONE_SIZE;
    const requested = typeof req.body?.size === 'string' ? req.body.size.trim() : '';
    const size = requested || (onlyOneSize ? ONE_SIZE : '');
    if (!size) {
      return res.status(400).json({
        success: false,
        code: 'SIZE_REQUIRED',
        message: 'This product tracks stock per size. Choose the size to restock.',
        sizes: buckets.map(row => row.size)
      });
    }
    const bucket = buckets.find(row => row.size === size);
    if (!bucket) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_SIZE',
        message: `Product does not stock size "${size}"`,
        sizes: buckets.map(row => row.size)
      });
    }

    const updated = await Product.findOneAndUpdate(
      {
        ...selector,
        sizeStock: { $elemMatch: { size, stock: { $gte: delta < 0 ? -delta : 0 } } }
      },
      { $inc: { 'sizeStock.$[bucket].stock': delta, stock: delta } },
      { new: true, arrayFilters: [{ 'bucket.size': size }] }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: `Size ${size} does not hold ${-delta} units to remove`
      });
    }

    return res.json({ success: true, data: await settleDerived(updated) });
  } catch (err) {
    console.error(`Error restocking product ${req.params.id}:`, err);
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
  restockProduct,
  deleteProduct,
  CATEGORY_NAMES
};
