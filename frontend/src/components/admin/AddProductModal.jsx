import React, { useState } from 'react';
import { X, Upload, Plus, Sparkles, Image as ImageIcon, Check } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    id: `SKU-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Tops',
    price: '',
    stock: 25,
    status: 'In Stock',
    color: 'Matcha Green',
    fit: 'Boxy Oversized',
    season: 'SS26',
    description: '',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    tag: 'NEW RELEASE',
  });

  const [imagePreview, setImagePreview] = useState(formData.image);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'image') {
      setImagePreview(value);
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Garment name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errs.price = 'Valid price is required';
    if (formData.stock === '' || parseInt(formData.stock, 10) < 0) errs.stock = 'Stock must be 0 or more';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newProduct = {
      ...formData,
      id: formData.id || `SKU-${Date.now().toString().slice(-4)}`,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      status: parseInt(formData.stock, 10) > 10 ? 'In Stock' : parseInt(formData.stock, 10) > 0 ? 'Low Stock' : 'Out of Stock',
      createdAt: new Date().toISOString(),
      rating: 5.0,
      reviewsCount: 0,
      isFeatured: true,
      inStock: parseInt(formData.stock, 10) > 0,
    };

    onAddProduct(newProduct);
    onClose();
  };

  // Preset sample image options for quick testing
  const sampleImages = [
    { label: 'Matcha Tee', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
    { label: 'Olive Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80' },
    { label: 'Wide Trousers', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80' },
    { label: 'Artisan Hat', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in select-none">
      <div className="bg-[#FAF8F5] border border-[#D9D3C7] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#FAF8F5]/95 backdrop-blur-md px-6 py-5 border-b border-[#D9D3C7] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Admin Inventory Control</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-[#2D231E] tracking-tight">
              Add New Garment Release
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B5E55] hover:text-[#2D231E] hover:bg-[#D9D3C7]/40 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Garment Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">
                Garment Name <span className="text-[#BC5A36]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. MatchA Raw Silk Heavy Tee"
                className={`w-full px-4 py-3 bg-white border ${errors.name ? 'border-[#BC5A36]' : 'border-[#D9D3C7]'} rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27]`}
              />
              {errors.name && <p className="text-[11px] text-[#BC5A36] font-bold">{errors.name}</p>}
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">SKU Identifier</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#EFECE6] border border-[#D9D3C7] rounded-xl text-[#2D231E] font-bold outline-none"
              />
            </div>
          </div>

          {/* Category, Price, Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] font-bold outline-none focus:ring-1 focus:ring-[#2D5A27] cursor-pointer"
              >
                <option value="Tops">Tops & Knitwear</option>
                <option value="Bottoms">Bottoms & Denim</option>
                <option value="Outerwear">Outerwear & Coats</option>
                <option value="Accessories">Accessories & Tea</option>
              </select>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">
                Price (USD) <span className="text-[#BC5A36]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55] font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="58.00"
                  className={`w-full pl-8 pr-4 py-3 bg-white border ${errors.price ? 'border-[#BC5A36]' : 'border-[#D9D3C7]'} rounded-xl text-[#2D231E] font-bold outline-none focus:ring-1 focus:ring-[#2D5A27]`}
                />
              </div>
              {errors.price && <p className="text-[11px] text-[#BC5A36] font-bold">{errors.price}</p>}
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">
                Initial Stock <span className="text-[#BC5A36]">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="25"
                className={`w-full px-4 py-3 bg-white border ${errors.stock ? 'border-[#BC5A36]' : 'border-[#D9D3C7]'} rounded-xl text-[#2D231E] font-bold outline-none focus:ring-1 focus:ring-[#2D5A27]`}
              />
              {errors.stock && <p className="text-[11px] text-[#BC5A36] font-bold">{errors.stock}</p>}
            </div>
          </div>

          {/* Color, Fit, Season */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Forest Moss"
                className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27]"
              />
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">Silhouette / Fit</label>
              <select
                name="fit"
                value={formData.fit}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27] cursor-pointer"
              >
                <option value="Boxy Oversized">Boxy Oversized</option>
                <option value="Relaxed Tailored">Relaxed Tailored</option>
                <option value="Standard Fit">Standard Fit</option>
                <option value="Wide Leg">Wide Leg</option>
                <option value="Cropped">Cropped</option>
              </select>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="font-bold text-[#2D231E] uppercase">Season</label>
              <select
                name="season"
                value={formData.season}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27] cursor-pointer"
              >
                <option value="SS26">SS26 (Spring/Summer)</option>
                <option value="FW26">FW26 (Fall/Winter)</option>
                <option value="Core">Core Collection</option>
                <option value="Archive">Limited Capsule</option>
              </select>
            </div>
          </div>

          {/* Image URL & Live Preview */}
          <div className="space-y-3 font-mono text-xs">
            <label className="font-bold text-[#2D231E] uppercase">Garment Photo / Artwork URL</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="Paste direct HTTPS image URL"
                  className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27]"
                />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#EFECE6] border border-[#D9D3C7] overflow-hidden flex items-center justify-center shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                ) : (
                  <ImageIcon size={18} className="text-[#6B5E55]" />
                )}
              </div>
            </div>

            {/* Quick Sample Image Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-[#6B5E55]">Presets:</span>
              {sampleImages.map((s) => (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => {
                    setFormData((p) => ({ ...p, image: s.url }));
                    setImagePreview(s.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#D9D3C7] hover:border-[#2D5A27] text-[11px] font-bold text-[#2D231E] transition-all cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="font-bold text-[#2D231E] uppercase">Description & Material Notes</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Crafted from 320gsm organic Japanese cotton. Bio-washed with natural matcha pigments for a tactile drape."
              className="w-full px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27] resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D3C7]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-[#D9D3C7] text-xs font-bold font-mono uppercase text-[#6B5E55] hover:text-[#2D231E] hover:bg-white rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
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
