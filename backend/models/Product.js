import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const variantSchema = new Schema(
  {
    color: { type: String, required: true },
    colorHex: { type: String, required: true },
    image: { type: String, required: true }
  },
  { _id: false }
);

/* Stock is held per size, because that is how it runs out.

   A single number per product cannot answer the only question a shopper
   actually asks — "is there an M?" — so a garment whose M had gone still
   showed as in stock on the strength of the XLs nobody wanted.

   ONE_SIZE is the bucket for anything sold without a size: accessories, and
   for now the lookbook garments that were imported without one. It is a real
   key rather than an empty string so that an order that forgot to send a size
   cannot silently land in the same bucket as a deliberate one-size item. */
export const ONE_SIZE = 'ONE';

const sizeStockSchema = new Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    tag: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']
    },
    subCategory: {
      type: String,
      trim: true
    },
    season: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    colorHex: {
      type: String,
      trim: true
    },
    fit: {
      type: String,
      trim: true
    },
    sizes: {
      type: [String],
      default: []
    },
    variants: {
      type: [variantSchema],
      default: []
    },
    /* Per-size stock. The authoritative figure: this is what is decremented
       when an order is placed, under a condition that refuses to go below
       zero. */
    sizeStock: {
      type: [sizeStockSchema],
      default: []
    },

    /* The total across every size, kept in step by the hook below.

       It is derived, not authoritative. It stays because the catalogue,
       the admin inventory table and `inStock` all read a single number, and
       because an order placed before a product was migrated still needs
       somewhere to land. Never decrement this directly. */
    stock: {
      type: Number,
      min: 0,
      default: 50
    },
    inStock: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewsCount: {
      type: Number,
      min: 0,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    gallery: {
      type: [Schema.Types.Mixed],
      default: []
    },
    specs: {
      type: Schema.Types.Mixed,
      default: {}
    },
    mediaRevision: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// ซิงค์ id กับ sku ให้ตรงกันอัตโนมัติ
productSchema.pre('validate', function syncIdentifiers(next) {
  if (!this.sku && this.id) this.sku = this.id;
  if (!this.id && this.sku) this.id = this.sku;
  
  /* sizeStock leads and stock follows, once a product has been migrated.
     A product that has not been is left on its own `stock` exactly as before,
     so nothing breaks while the migration is only half run. */
  if (Array.isArray(this.sizeStock) && this.sizeStock.length) {
    this.stock = this.sizeStock.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);
  } else if (this.stock === undefined && this.inStock !== undefined) {
    this.stock = this.inStock ? 50 : 0;
  }
  this.inStock = (this.stock || 0) > 0;
  if (typeof next === 'function') next();
});

// Order placement looks a product up by id or sku and then by size within it.
productSchema.index({ id: 1, 'sizeStock.size': 1 });
productSchema.index({ category: 1, season: 1 });
productSchema.index({ name: 'text', description: 'text', color: 'text', tag: 'text' });

const Product = mongoose.models.Product || model('Product', productSchema);

export default Product;
export { Product };
