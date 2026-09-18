import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ShippingStep from '../components/payment/ShippingStep';
import PaymentMethodStep from '../components/payment/PaymentMethodStep';
import OrderSummarySidebar from '../components/payment/OrderSummarySidebar';
import OrderSuccessModal from '../components/payment/OrderSuccessModal';
import { api } from '../services/api';
import { useStoreMode } from '../context/StoreModeContext.jsx';
import { SHIPPING_OPTIONS as SHIPPING_RATES, shippingCostFor } from '../config/shipping';
import { couponFor, discountFor, normaliseCode, FEATURED_CODES, takePendingCoupon } from '../config/coupons';
import PreviewNote from '../components/ui/PreviewNote';
import { QrCode, AlertTriangle, RotateCcw, Check, ArrowRight } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa', icon: '💳' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'qr', name: 'PromptPay QR', icon: <QrCode size={20} /> },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Express Shipping', price: SHIPPING_RATES.standard, days: '3-5 business days' },
  { id: 'express', name: 'Priority Courier Shipping', price: SHIPPING_RATES.express, days: '1-2 business days' },
  { id: 'premium', name: 'VIP Same-Day Delivery', price: SHIPPING_RATES.premium, days: 'Guaranteed 24 Hours' },
];

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'Bangkok',
  zipCode: '',
  country: 'Thailand',
};

const initialCardData = {
  cardNumber: '',
  cardHolder: '',
  expiryDate: '',
  cvv: '',
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { showToast } = useToast();
  const { isDemo } = useStoreMode();

  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment'
  const stepMotionRef = useChangeMotion(step);
  const [selectedPayment, setSelectedPayment] = useState('visa');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [formData, setFormData] = useState(initialFormData);
  const [cardData, setCardData] = useState(initialCardData);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [checkoutRequestId] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Redirect to cart if bag is empty and not viewing success modal
  useEffect(() => {
    if (cartItems.length === 0 && !showSuccessModal) {
      navigate('/cart');
    }
  }, [cartItems, showSuccessModal, navigate]);

  // Handle pending coupon applied from banners
  useEffect(() => {
    const pending = takePendingCoupon();
    if (!pending) return;
    setAppliedCoupon(pending);
    showToast(`Applied coupon ${pending.code} (${pending.label})`, 'success');
  }, [showToast]);

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const shippingCost = shippingCostFor(subtotal, selectedShipping, {
    freeShippingCoupon: appliedCoupon?.type === 'free_shipping'
  });

  const discount = discountFor(appliedCoupon, subtotal);
  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = normaliseCode(couponCode);
    const coupon = couponFor(code);

    if (!coupon) {
      setCouponError(`Invalid promo code. Try ${FEATURED_CODES.join(' or ')}`);
      return;
    }

    setAppliedCoupon({ ...coupon, code });
    showToast(`Applied coupon: ${code} (${coupon.label}) ✨`);
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    showToast('Removed promotional code.');
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);
    setIsProcessing(true);
    try {
      const orderPayload = {
        idempotencyKey: checkoutRequestId,
        customer: formData,
        items: cartItems.map(item => ({
          productId: item.id || item.productId || 'SKU-ITEM',
          name: item.name || 'MatchA Garment',
          quantity: Number(item.quantity) || 1,
          size: item.size || '',
          color: item.color || 'Default',
          image: item.image || ''
        })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod: selectedPayment,
        shippingOption: selectedShipping
      };

      const res = await api.createOrder(orderPayload);
      if (!res || res.success === false || !res.data) {
        throw new Error(res?.message || 'Server did not acknowledge order creation.');
      }
      setCreatedOrder(res.data);
      showToast('Order confirmed and recorded in atelier vault!', 'success');
      setShowSuccessModal(true);
      clearCart();
    } catch (err) {
      console.error('Order creation failed:', err.message);
      showToast(err.message || 'Could not place order. Please try again.', 'error');
      setOrderError(err.message || 'Could not place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-[#F7F6F2] text-[#111111] min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Luxury Checkout Stepper Header */}
        <div className="mb-10 pb-6 border-b border-[#E5E2D9] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] uppercase text-[#518F5C] font-semibold">
              <span>MatchA Atelier</span>
              <span>/</span>
              <span>Secure Checkout</span>
              <span>/</span>
              <span className="text-[#111111]">お会計</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight mt-1 font-serif">
              {step === 'shipping' ? 'Shipping & Handover' : 'Payment Authorization'}
            </h1>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8EFE9] text-[#042509] font-bold border border-[#518F5C]/30 hover:bg-[#D7E5D9] transition-colors cursor-pointer"
            >
              <Check size={13} className="text-[#042509]" />
              <span>Bag</span>
            </button>

            <span className="text-[#D5D2C9]">/</span>

            <button
              onClick={() => setStep('shipping')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                step === 'shipping'
                  ? 'bg-[#042509] text-white shadow-xs'
                  : 'bg-[#E8EFE9] text-[#042509]'
              }`}
            >
              {step === 'payment' ? <Check size={13} /> : null}
              <span>1. Destination</span>
            </button>

            <span className="text-[#D5D2C9]">/</span>

            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold ${
                step === 'payment'
                  ? 'bg-[#042509] text-white shadow-xs'
                  : 'bg-white border border-[#E5E2D9] text-[#888888]'
              }`}
            >
              <span>2. Payment</span>
            </div>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Main Form Step Area */}
          <div ref={stepMotionRef} className="lg:col-span-7">
            {isDemo && (
              <PreviewNote className="mb-6">
                <strong>Atelier Simulation Mode</strong> — All steps reflect the live production checkout flow. No real banking charge will occur. You may use mock test card details or select PromptPay QR.
              </PreviewNote>
            )}

            {step === 'shipping' ? (
              <ShippingStep
                formData={formData}
                onFormChange={setFormData}
                shippingOptions={SHIPPING_OPTIONS}
                selectedShipping={selectedShipping}
                onSelectShipping={setSelectedShipping}
                onNext={() => {
                  setStep('payment');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBackToCart={() => navigate('/cart')}
              />
            ) : (
              <PaymentMethodStep
                paymentMethods={PAYMENT_METHODS}
                selectedPayment={selectedPayment}
                onSelectPayment={setSelectedPayment}
                cardData={cardData}
                onCardDataChange={setCardData}
                onBack={() => {
                  setStep('shipping');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                totalAmount={total}
              />
            )}

            {/* Error Notification Banner */}
            {step === 'payment' && orderError && (
              <div
                role="alert"
                className="mt-6 p-6 rounded-3xl border border-[#C91D1D]/30 bg-[#FBEAEA] shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white text-[#C91D1D] shrink-0 shadow-xs">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C91D1D] block">
                      TRANSACTION NOT COMPLETED
                    </span>
                    <h3 className="text-lg font-black font-serif text-[#111111] mt-0.5">
                      Order Registration Failed
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#C91D1D]/20 bg-white text-xs font-mono text-[#C91D1D]">
                  {orderError}
                </div>

                <p className="text-xs font-mono text-[#555555] leading-relaxed">
                  Your curated bag items and delivery details have been safely retained. No amount was debited.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'Authorizing...' : 'Try Again'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3 bg-white border border-[#D5D2C9] text-[#111111] hover:border-[#042509] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                  >
                    Edit Shipping Info
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <OrderSummarySidebar
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              discount={discount}
              total={total}
              couponCode={couponCode}
              onCouponCodeChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              appliedCoupon={appliedCoupon}
              couponError={couponError}
              onRemoveCoupon={handleRemoveCoupon}
            />
          </div>

        </div>

        {/* Dispatch Certificate Success Modal */}
        <OrderSuccessModal
          isOpen={showSuccessModal}
          order={createdOrder}
          orderNumber={createdOrder?.orderId || `MTA-2026-${Math.floor(1000 + Math.random() * 9000)}`}
          formData={formData}
          totalAmount={createdOrder?.total ?? total}
          onDone={() => setShowSuccessModal(false)}
        />

      </div>
    </div>
  );
}
