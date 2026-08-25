import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, Shield, Lock, ChevronRight, ChevronLeft, Check, X, Minus, Plus, Trash2, QrCode, Gift, Home, MapPin, Phone, Mail, User } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa', icon: '💳', color: '#1A1F71' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳', color: '#EB001B' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵', color: '#2D5A27' },
  { id: 'qr', name: 'QR Code', icon: <QrCode size={20} />, color: '#2D231E' },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Shipping', price: 0, days: '5-7 business days', icon: <Truck size={18} /> },
  { id: 'express', name: 'Express Shipping', price: 15.99, days: '2-3 business days', icon: <Truck size={18} /> },
  { id: 'premium', name: 'Premium Shipping', price: 29.99, days: 'Next business day', icon: <Shield size={18} /> },
];

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Thailand',
};

const initialCardData = {
  cardNumber: '',
  cardHolder: '',
  expiryDate: '',
  cvv: '',
};

export default function Payment({ cartItems = [], onUpdateCart }) {
  const [step, setStep] = useState('cart');
  const [selectedPayment, setSelectedPayment] = useState('visa');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [formData, setFormData] = useState(initialFormData);
  const [cardData, setCardData] = useState(initialCardData);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [couponError, setCouponError] = useState('');

  const COUPONS = {
    'MATCHA15': { discount: 15, type: 'percent' },
    'WELCOME10': { discount: 10, type: 'percent' },
    'FREESHIP': { discount: 0, type: 'free_shipping' },
    'SAVE20': { discount: 20, type: 'percent', minAmount: 100 },
  };

  useEffect(() => {
    if (cartItems.length === 0 && step !== 'cart') {
      setStep('cart');
    }
  }, [cartItems]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.priceNum || 0) * (item.quantity || 1), 0);
  };

  const calculateShipping = () => {
    const shipping = SHIPPING_OPTIONS.find(s => s.id === selectedShipping);
    if (appliedCoupon?.type === 'free_shipping') return 0;
    return shipping?.price || 0;
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      if (appliedCoupon.minAmount && subtotal < appliedCoupon.minAmount) return 0;
      return subtotal * (appliedCoupon.discount / 100);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() - calculateDiscount();
  };

  const handleQuantityChange = (itemId, delta) => {
    onUpdateCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId) => {
    onUpdateCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleNextStep = () => {
    if (step === 'cart' && cartItems.length > 0) {
      setStep('shipping');
    } else if (step === 'shipping') {
      if (validateShippingForm()) {
        setStep('payment');
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 'shipping') setStep('cart');
    else if (step === 'payment') setStep('shipping');
  };

  const validateShippingForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'zipCode'];
    for (const field of required) {
      if (!formData[field].trim()) {
        return false;
      }
    }
    return true;
  };

  const validateCardForm = () => {
    if (selectedPayment === 'cod' || selectedPayment === 'qr') return true;
    const required = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
    for (const field of required) {
      if (!cardData[field].trim()) return false;
    }
    return cardData.cardNumber.replace(/\s/g, '').length >= 15 &&
           cardData.cvv.length >= 3 &&
           cardData.expiryDate.match(/^\d{2}\/\d{2}$/);
  };

  const applyCoupon = () => {
    const coupon = COUPONS[couponCode.toUpperCase()];
    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }
    const subtotal = calculateSubtotal();
    if (coupon.minAmount && subtotal < coupon.minAmount) {
      setCouponError(`Minimum order $${coupon.minAmount} required`);
      return;
    }
    setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
    setCouponError('');
    setCouponCode('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePlaceOrder = async () => {
    if (!validateCardForm()) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowSuccess(true);
    onUpdateCart([]);
  };

  const formatPrice = (price) => `$${price.toFixed(2)}`;

  const getItemImage = (item) => item.image || '/images/placeholder.jpg';

  if (cartItems.length === 0 && step === 'cart') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center p-12 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#D0DEC6]/60 flex items-center justify-center text-4xl">
            🛍️
          </div>
          <h2 className="text-3xl font-bold text-[#2D231E] mb-3">Your Cart is Empty</h2>
          <p className="text-[#6B5E55] mb-8">Add some items to proceed to checkout</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Home size={16} />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center p-12 animate-fade-in max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#2D5A27] flex items-center justify-center text-4xl text-white animate-scale-up">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-[#2D231E] mb-3">Order Confirmed!</h2>
          <p className="text-[#6B5E55] mb-8">Thank you for your purchase. Your order has been placed successfully.</p>
          <button
            onClick={() => { setShowSuccess(false); setStep('cart'); window.location.href = '/'; }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-1.5 bg-[#D9D3C7] z-0" />
            {['cart', 'shipping', 'payment'].map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  if (s === 'cart' || (s === 'shipping' && step !== 'cart') || (s === 'payment' && step === 'payment')) {
                    setStep(s);
                  }
                }}
                disabled={s === 'shipping' && step === 'cart'}
                className={`relative z-10 flex flex-col items-center transition-all ${
                  ['cart', 'shipping', 'payment'].indexOf(step) >= i ? 'text-[#2D5A27]' : 'text-[#D9D3C7] pointer-events-none'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-3 transition-all ${
                  ['cart', 'shipping', 'payment'].indexOf(step) >= i 
                    ? 'bg-[#2D5A27] border-[#2D5A27] text-white shadow-lg shadow-[#2D5A27]/30' 
                    : 'bg-white border-[#D9D3C7]'
                }`}>
                  {['cart', 'shipping', 'payment'].indexOf(step) > i ? (
                    <Check size={20} />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span className="mt-2 text-xs font-mono font-bold uppercase tracking-wider mt-2">
                  {s === 'cart' ? 'Review' : s === 'shipping' ? 'Shipping' : 'Payment'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left: Order Summary / Cart / Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Cart Review */}
            {step === 'cart' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-[#2D231E] mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#2D5A27] text-white flex items-center justify-center text-xs font-mono">1</span>
                  Review Your Order
                </h2>
                
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-4 bg-white border border-[#D9D3C7] rounded-2xl p-4 hover:border-[#BC5A36]/50 transition-colors">
                      <div className="w-24 h-24 shrink-0 rounded-xl bg-[#FAF8F5] flex items-center justify-center overflow-hidden">
                        <img
                          src={getItemImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-[#2D231E] line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-[#6B5E55] mt-0.5 font-mono">
                              {item.color || 'Default'} / {item.size || 'M'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 rounded-lg text-[#6B5E55] hover:text-[#BC5A36] hover:bg-[#F5F0EB] transition-colors shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#D9D3C7] rounded-xl overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="w-9 h-9 flex items-center justify-center text-[#2D231E] hover:bg-[#F5F0EB] transition-colors font-bold"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-4 text-sm font-mono font-bold text-[#2D231E]">{item.quantity || 1}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-9 h-9 flex items-center justify-center text-[#2D231E] hover:bg-[#F5F0EB] transition-colors font-bold"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="font-bold text-[#2D5A27]">
                            {formatPrice((item.priceNum || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="mt-6 bg-white border border-[#D9D3C7] rounded-2xl p-5">
                  <h3 className="font-semibold text-[#2D231E] mb-3 flex items-center gap-2">
                    <Gift size={20} className="text-[#BC5A36]" />
                    Discount Code
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-[#D0DEC6]/30 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Gift size={20} className="text-[#2D5A27]" />
                        <div>
                          <p className="font-semibold text-[#2D231E]">{appliedCoupon.code}</p>
                          <p className="text-xs text-[#6B5E55]">
                            {appliedCoupon.type === 'percent' 
                              ? `${appliedCoupon.discount}% off applied` 
                              : 'Free shipping applied'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-[#BC5A36] hover:underline font-mono"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 uppercase tracking-wider font-mono text-sm"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={!couponCode.trim()}
                        className="px-6 py-3 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-2 text-xs text-[#BC5A36] font-mono animate-fade-in">{couponError}</p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-white border border-[#D9D3C7] rounded-2xl p-5">
                  <h3 className="font-semibold text-[#2D231E] mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-[#2D5A27]" />
                    Order Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[#6B5E55]">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span className="text-[#2D231E] font-medium">{formatPrice(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-[#6B5E55]">
                      <span>Shipping</span>
                      <span className="text-[#2D231E] font-medium">
                        {calculateShipping() === 0 ? 'FREE' : formatPrice(calculateShipping())}
                      </span>
                    </div>
                    {appliedCoupon && calculateDiscount() > 0 && (
                      <div className="flex justify-between text-[#2D5A27] font-medium">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-{formatPrice(calculateDiscount())}</span>
                      </div>
                    )}
                    <div className="border-t border-[#D9D3C7] pt-3 flex justify-between text-lg font-bold text-[#2D231E]">
                      <span>Total</span>
                      <span className="text-[#2D5A27]">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full py-4 bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#2D5A27]/30 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Shipping</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Step 2: Shipping Info */}
            {step === 'shipping' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <button
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 text-sm text-[#6B5E55] hover:text-[#2D231E] transition-colors mb-3 cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                      Back to Cart
                    </button>
                    <h2 className="text-2xl font-bold text-[#2D231E] flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[#2D5A27] text-white flex items-center justify-center text-xs font-mono">2</span>
                      Shipping Information
                    </h2>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                      placeholder="+66 XX XXX XXXX"
                    />
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">City *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                        placeholder="Bangkok"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">State/Province *</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                        placeholder="Bangkok"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Zip Code *</label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                        className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                        placeholder="10100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 bg-white"
                    >
                      <option value="Thailand">Thailand</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>
                </div>

                {/* Shipping Method Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[#2D231E] mb-3 flex items-center gap-2">
                    <Truck size={20} className="text-[#2D5A27]" />
                    Shipping Method
                  </h3>
                  <div className="space-y-2">
                    {SHIPPING_OPTIONS.map((option) => (
                      <label key={option.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedShipping === option.id
                          ? 'border-[#2D5A27] bg-[#2D5A27]/5'
                          : 'border-[#D9D3C7] hover:border-[#BC5A36]/50'
                      }`}>
                        <input
                          type="radio"
                          name="shipping"
                          value={option.id}
                          checked={selectedShipping === option.id}
                          onChange={() => setSelectedShipping(option.id)}
                          className="w-5 h-5 text-[#2D5A27] border-[#BC5A36] focus:ring-[#2D5A27] accent-[#2D5A27]"
                        />
                        <div className="p-2 rounded-lg bg-white flex items-center justify-center">
                          {typeof option.icon === 'object' ? option.icon : <span>{option.icon}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#2D231E]">{option.name}</p>
                          <p className="text-xs text-[#6B5E55]">{option.days}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#2D231E]">
                            {option.price === 0 ? 'FREE' : formatPrice(option.price)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 py-4 border-2 border-[#D9D3C7] hover:border-[#BC5A36] text-[#2D231E] font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!validateShippingForm()}
                    className="flex-1 py-4 bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#2D5A27]/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continue to Payment</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 'payment' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <button
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 text-sm text-[#6B5E55] hover:text-[#2D231E] transition-colors mb-3 cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                      Back to Shipping
                    </button>
                    <h2 className="text-2xl font-bold text-[#2D231E] flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[#2D5A27] text-white flex items-center justify-center text-xs font-mono">3</span>
                      Payment Method
                    </h2>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        selectedPayment === method.id
                          ? 'border-[#2D5A27] bg-[#2D5A27]/5 shadow-lg shadow-[#2D5A27]/10'
                          : 'border-[#D9D3C7] hover:border-[#BC5A36]/50'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        typeof method.icon === 'object' ? 'bg-white' : `bg-[${method.color}]/10`
                      }`}>
                        {typeof method.icon === 'object' ? method.icon : <span className="text-2xl">{method.icon}</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-[#2D231E]">{method.name}</p>
                        {method.id === 'cod' && (
                          <p className="text-xs text-[#6B5E55]">Pay when delivered</p>
                        )}
                        {method.id === 'qr' && (
                          <p className="text-xs text-[#6B5E55]">Scan to pay</p>
                        )}
                      </div>
                      {selectedPayment === method.id && (
                        <Check className="w-5 h-5 text-[#2D5A27]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Card Details */}
                {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
                  <div className="bg-white border border-[#D9D3C7] rounded-2xl p-5 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-[#2D231E] mb-4 flex items-center gap-2">
                      <Lock size={20} className="text-[#2D5A27]" />
                      Card Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Card Number</label>
                        <input
                          type="text"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData({...cardData, cardNumber: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()})}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 font-mono"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Card Holder</label>
                          <input
                            type="text"
                            value={cardData.cardHolder}
                            onChange={(e) => setCardData({...cardData, cardHolder: e.target.value.toUpperCase()})}
                            placeholder="JOHN DOE"
                            className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">Expiry Date</label>
                          <input
                            type="text"
                            value={cardData.expiryDate}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                              setCardData({...cardData, expiryDate: val});
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#2D231E] uppercase tracking-wider mb-1.5">CVV</label>
                          <input
                            type="password"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0,4)})}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-4 py-3 border border-[#D9D3C7] rounded-xl text-[#2D231E] placeholder-[#6B5E55] focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Payment */}
                {selectedPayment === 'qr' && (
                  <div className="bg-white border border-[#D9D3C7] rounded-2xl p-8 mb-6 animate-fade-in text-center">
                    <h3 className="font-semibold text-[#2D231E] mb-4 flex items-center justify-center gap-2">
                      <QrCode size={20} className="text-[#2D5A27]" />
                      Scan QR Code to Pay
                    </h3>
                    <div className="w-48 h-48 mx-auto mb-4 bg-[#FAF8F5] rounded-xl flex items-center justify-center border border-[#D9D3C7] relative overflow-hidden">
                      <div className="text-6xl">📱</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A27]/10 to-[#BC5A36]/10" />
                    </div>
                    <p className="text-[#6B5E55] text-sm">Open your banking app and scan the QR code</p>
                    <p className="text-xs text-[#BC5A36] font-mono mt-2">PromptPay • TrueMoney • LINE Pay</p>
                  </div>
                )}

                {/* Cash on Delivery Info */}
                {selectedPayment === 'cod' && (
                  <div className="bg-white border border-[#D9D3C7] rounded-2xl p-5 mb-6 animate-fade-in">
                    <div className="flex items-center gap-3 p-3 bg-[#D0DEC6]/30 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-[#2D5A27] flex items-center justify-center text-white">
                        💵
                      </div>
                      <div>
                        <p className="font-semibold text-[#2D231E]">Cash on Delivery</p>
                        <p className="text-xs text-[#6B5E55]">Pay in cash when your order is delivered. Additional 2% fee may apply.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Badges */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs text-[#6B5E55]">
                    <Lock size={14} className="text-[#2D5A27]" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B5E55]">
                    <Shield size={14} className="text-[#2D5A27]" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B5E55]">
                    <CreditCard size={14} className="text-[#2D5A27]" />
                    <span>PCI Compliant</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 py-4 border-2 border-[#D9D3C7] hover:border-[#BC5A36] text-[#2D231E] font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || !validateCardForm()}
                    className="flex-1 py-4 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#BC5A36]/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <span className="text-lg">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border border-[#D9D3C7] rounded-2xl p-5">
                <h3 className="font-semibold text-[#2D231E] mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#2D5A27]" />
                  Order Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#6B5E55]">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="text-[#2D231E] font-medium">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E55]">
                    <span>Shipping</span>
                    <span className="text-[#2D231E] font-medium">
                      {calculateShipping() === 0 ? 'FREE' : formatPrice(calculateShipping())}
                    </span>
                  </div>
                  {appliedCoupon && calculateDiscount() > 0 && (
                    <div className="flex justify-between text-[#2D5A27] font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(calculateDiscount())}</span>
                    </div>
                  )}
                  <div className="border-t border-[#D9D3C7] pt-3 flex justify-between text-lg font-bold text-[#2D231E]">
                    <span>Total</span>
                    <span className="text-[#2D5A27]">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white border border-[#D9D3C7] rounded-2xl p-5">
                <h3 className="font-semibold text-[#2D231E] mb-4">Secure & Trusted</h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: '100% Secure Payment', desc: 'SSL encrypted checkout' },
                    { icon: Lock, text: 'Protected by PCI DSS', desc: 'Bank-grade security' },
                    { icon: Truck, text: 'Fast Delivery', desc: 'Track your order' },
                    { icon: Gift, text: 'Easy Returns', desc: '30-day return policy' },
                  ].map((badge, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D0DEC6]/30 flex items-center justify-center">
                        <badge.icon size={18} className="text-[#2D5A27]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D231E] text-sm">{badge.text}</p>
                        <p className="text-xs text-[#6B5E55]">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-[#2D231E] text-[#FAF8F5] rounded-2xl p-5">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-[#D0DEC6]/80 text-sm mb-4">Our support team is here to assist you</p>
                <div className="space-y-2 text-sm">
                  <a href="mailto:support@matcha.com" className="flex items-center gap-2 text-[#D0DEC6] hover:text-white transition-colors">
                    <Mail size={16} />
                    <span>support@matcha.com</span>
                  </a>
                  <a href="tel:+6620000000" className="flex items-center gap-2 text-[#D0DEC6] hover:text-white transition-colors">
                    <Phone size={16} />
                    <span>+66 2 000 0000</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}