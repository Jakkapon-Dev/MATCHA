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

const productSchema = new Schema(
  {
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
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
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
    }
  },
  { timestamps: true }
);

productSchema.pre('validate', function syncInStock(next) {
  this.inStock = this.stock > 0;
  next();
});

productSchema.index({ category: 1, season: 1 });
productSchema.index({ name: 'text', description: 'text', color: 'text', tag: 'text' });

const Product = model('Product', productSchema);

export default Product;
