import React, { useState } from 'react';
import { X, Upload, Plus, Sparkles, Image as ImageIcon, Check, Calendar, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { webpSrc } from '../../utils/imageFallback';

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  // The form is initialized once when this component mounts. Defaults provide a testable product shape, 
  // while the generated SKU distinguishes new entries.
  const [formData, setFormData] = useState({
    name: '',
    id: `SKU-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Tops',
    price: '',
    stock: '25',
    date: new Date().toISOString().split('T')[0],
    tag: 'NEW RELEASE',
    status: 'In Stock',
    color: 'Matcha Green',
    fit: 'Boxy Oversized',
    season: 'SS26',
    description: '',
    image: '/images/products/autumn/tops/shirts/color_1_brown.jpeg',
  });

  const [imagePreview, setImagePreview] = useState(formData.image);
  const [errors, setErrors] = useState({});

  // Keep the modal out of the DOM while closed so it cannot capture focus or clicks.
  // Closing does not reset local state; reopening the same mounted instance restores it.
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Every input is controlled by formData and uses its name as the object key.
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // The preview mirrors the image field, including manually entered URLs.
    if (name === 'image') {
      setImagePreview(value);
    }

    // Clear only the edited field's error; a full validation runs again on submit.
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    // Collect all validation failures in one pass so QA can verify every invalid
    // field and message after a single submission attempt.
    const errs = {};

    // 1. Name validation
    if (!formData.name.trim()) {
      errs.name = 'Garment name is required';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Garment name must be at least 3 characters';
    }

    // 2. Description validation
    if (!formData.description.trim()) {
      errs.description = 'Product description is required';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters';
    }

    // 3. Price validation
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errs.price = 'Valid price greater than $0 is required';
    }

    // 4. Quantity / Stock validation
    if (formData.stock === '' || isNaN(parseInt(formData.stock, 10)) || parseInt(formData.stock, 10) < 0) {
      errs.stock = 'Stock must be a positive number (0 or more)';
    }

    // 5. Date validation
    if (!formData.date || !formData.date.trim()) {
      errs.date = 'Release date is required';
    }

    // 6. Tag validation
    if (!formData.tag || !formData.tag.trim()) {
      errs.tag = 'Product tag / badge is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Invalid submissions remain open and do not notify the parent inventory page.
    if (!validate()) return;

    // Form controls store numeric values as strings. Normalize them here and derive
    // the inventory flags/status expected by product lists and catalog consumers.
    const stockNum = parseInt(formData.stock, 10);
    const newProduct = {
      ...formData,
      id: formData.id || `SKU-${Date.now().toString().slice(-4)}`,
      price: parseFloat(formData.price),
      stock: stockNum,
      status: stockNum > 10 ? 'In Stock' : stockNum > 0 ? 'Low Stock' : 'Out of Stock',
      createdAt: formData.date || new Date().toISOString().split('T')[0],
      rating: 5.0,
      reviewsCount: 0,
      isFeatured: true,
      inStock: stockNum > 0,
    };

    // The parent persists/inserts the completed product before the modal is closed.
    onAddProduct(newProduct);
    onClose();
  };

  // Preset sample image options for quick testing
  const sampleImages = [
    { label: 'Heavy Shirt', url: '/images/products/autumn/tops/shirts/color_1_brown.jpeg' },
    { label: 'Fleece Hoodie', url: '/images/products/autumn/tops/hoodies/color_1_burnt_orange.jpeg' },
    { label: 'Chino Pants', url: '/images/products/autumn/bottoms/chinos/color_1_olive.jpeg' },
    { label: 'Utility Bag', url: '/images/products/autumn/accessories/bags/color_1_burnt_orange.jpeg' },
    { label: 'Silk Scarf', url: '/images/products/autumn/accessories/scarves/color_1_burnt_orange.jpeg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in select-none">
      <div className="bg-[#F1F1F1] border border-[#DCDCDC] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#F1F1F1]/95 backdrop-blur-md px-6 py-5 border-b border-[#DCDCDC] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#042509] uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Admin Inventory Control</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-[#000000] tracking-tight">
              Add New Garment Release
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#666666] hover:text-[#000000] hover:bg-[#DCDCDC]/40 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* 1. Garment Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase flex items-center justify-between">
                <span>Garment Name <span className="text-[#C91D1D]">*</span></span>
                <span className="text-[10px] font-normal text-[#666666]">Min 3 chars</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. MatchA Heavyweight Boxy Tee"
                className={`w-full px-4 py-3 bg-white border ${errors.name ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] outline-none transition-all`}
              />
              {errors.name && (
                <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">SKU Identifier</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#EFECE6] border border-[#DCDCDC] rounded-xl text-[#000000] font-bold outline-none"
              />
            </div>
          </div>

          {/* 2. Category, Price, Quantity (Stock) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#DCDCDC] rounded-xl text-[#000000] font-bold outline-none focus:ring-1 focus:ring-[#042509] cursor-pointer"
              >
                <option value="Tops">Tops & Knitwear</option>
                <option value="Bottoms">Bottoms & Denim</option>
                <option value="Outerwear">Outerwear & Coats</option>
                <option value="Shoes">Shoes & Footwear</option>
                <option value="Accessories">Accessories & Bags</option>
              </select>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">
                Price (USD) <span className="text-[#C91D1D]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 inset-y-0 my-auto h-fit text-[#666666] font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="48.00"
                  className={`w-full pl-8 pr-4 py-3 bg-white border ${errors.price ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] font-bold outline-none transition-all`}
                />
              </div>
              {errors.price && (
                <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{errors.price}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">
                Quantity (Stock) <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="25"
                className={`w-full px-4 py-3 bg-white border ${errors.stock ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] font-bold outline-none transition-all`}
              />
              {errors.stock && (
                <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{errors.stock}</span>
                </p>
              )}
            </div>
          </div>

          {/* 3. Release Date, Tag, Season (Task 4 Required Fields) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Field: Date */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase flex items-center gap-1.5">
                <Calendar size={13} className="text-[#042509]" />
                <span>Release Date <span className="text-[#C91D1D]">*</span></span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border ${errors.date ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] font-bold outline-none transition-all cursor-pointer`}
              />
              {errors.date && (
                <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>

            {/* Field: Tag */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase flex items-center gap-1.5">
                <TagIcon size={13} className="text-[#C91D1D]" />
                <span>Product Tag <span className="text-[#C91D1D]">*</span></span>
              </label>
              <select
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border ${errors.tag ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] font-bold outline-none transition-all cursor-pointer`}
              >
                <option value="NEW RELEASE">NEW RELEASE</option>
                <option value="BESTSELLER">BESTSELLER</option>
                <option value="LIMITED ARCHIVE">LIMITED ARCHIVE</option>
                <option value="STAFF PICK">STAFF PICK</option>
                <option value="ESSENTIAL">ESSENTIAL</option>
                <option value="ORGANIC COTTON">ORGANIC COTTON</option>
              </select>
              {errors.tag && (
                <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{errors.tag}</span>
                </p>
              )}
            </div>

            {/* Field: Season */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">Season</label>
              <select
                name="season"
                value={formData.season}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#DCDCDC] rounded-xl text-[#000000] outline-none focus:ring-1 focus:ring-[#042509] cursor-pointer"
              >
                <option value="SS26">SS26 (Spring/Summer)</option>
                <option value="FW26">FW26 (Fall/Winter)</option>
                <option value="Core">Core Collection</option>
                <option value="Archive">Limited Capsule</option>
              </select>
            </div>

          </div>

          {/* 4. Color & Silhouette / Fit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">Color Shade</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Matcha Green"
                className="w-full px-4 py-3 bg-white border border-[#DCDCDC] rounded-xl text-[#000000] outline-none focus:ring-1 focus:ring-[#042509]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#000000] uppercase">Silhouette / Fit</label>
              <select
                name="fit"
                value={formData.fit}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#DCDCDC] rounded-xl text-[#000000] outline-none focus:ring-1 focus:ring-[#042509] cursor-pointer"
              >
                <option value="Boxy Oversized">Boxy Oversized (ทรงหลวมคลาสสิก)</option>
                <option value="Relaxed Tailored">Relaxed Tailored (ทรงปล่อยเข้ารูป)</option>
                <option value="Standard Fit">Standard Fit (ทรงมาตรฐาน)</option>
                <option value="Wide Leg">Wide Leg (ขากว้าง)</option>
                <option value="Cropped">Cropped (ทรงครอป)</option>
              </select>
            </div>
          </div>

          {/* 5. Image URL & Live Preview */}
          <div className="space-y-3 font-mono text-xs">
            <label className="font-bold text-[#000000] uppercase">Garment Photo / Artwork URL</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="Paste direct HTTPS image URL"
                  className="w-full px-4 py-3 bg-white border border-[#DCDCDC] rounded-xl text-[#000000] outline-none focus:ring-1 focus:ring-[#042509]"
                />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#EFECE6] border border-[#DCDCDC] overflow-hidden flex items-center justify-center shrink-0">
                {/* Hide a broken thumbnail while retaining the typed URL for correction. */}
                {imagePreview ? (
                  <img src={webpSrc(imagePreview)} data-original-src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                ) : (
                  <ImageIcon size={18} className="text-[#666666]" />
                )}
              </div>
            </div>

            {/* Quick Sample Image Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-[#666666]">Presets:</span>
              {sampleImages.map((s) => (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => {
                    // Presets update both values because the form payload and preview
                    // are intentionally maintained as separate pieces of state.
                    setFormData((p) => ({ ...p, image: s.url }));
                    setImagePreview(s.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#DCDCDC] hover:border-[#042509] text-[11px] font-bold text-[#000000] transition-all cursor-pointer active:scale-95"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Description & Material Notes (Validated Field) */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#000000] uppercase">
                Description & Material Notes <span className="text-[#C91D1D]">*</span>
              </label>
              <span className="text-[10px] text-[#666666]">Min 10 characters</span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Crafted from 320gsm organic Japanese cotton. Bio-washed with natural matcha pigments for a tactile drape."
              className={`w-full px-4 py-3 bg-white border ${errors.description ? 'border-[#C91D1D] focus:ring-1 focus:ring-[#C91D1D]' : 'border-[#DCDCDC] focus:ring-1 focus:ring-[#042509]'} rounded-xl text-[#000000] outline-none transition-all resize-none`}
            />
            {errors.description && (
              <p className="text-[11px] text-[#C91D1D] font-bold flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCDCDC]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-[#DCDCDC] text-xs font-bold font-mono uppercase text-[#666666] hover:text-[#000000] hover:bg-white rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Plus size={16} />
              <span>Publish to Inventory</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
