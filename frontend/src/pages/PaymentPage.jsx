import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
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
import { QrCode, AlertTriangle, RotateCcw, Check } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa', icon: '💳' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'qr', name: 'PromptPay QR', icon: <QrCode size={20} /> },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Delivery', price: SHIPPING_RATES.standard, days: '3-5 business days' },
  { id: 'express', name: 'Priority Express Courier', price: SHIPPING_RATES.express, days: '1-2 business days' },
  { id: 'premium', name: 'Same-Day Dispatch', price: SHIPPING_RATES.premium, days: 'Guaranteed 24 hours' },
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
  const { t } = useLanguage();
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
    showToast('Removed promo code.');
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
      showToast('Order confirmed successfully.', 'success');
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
    <div className="w-full bg-[#F1F1F1] text-[#0A0A0A] min-h-screen py-10 sm:py-14 px-5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Confident, Quiet Header */}
        <div className="mb-8 pb-5 border-b border-[#DCDCDC] flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
              {step === 'shipping' ? t('checkout.pageShipping') : t('checkout.pagePayment')}
            </h1>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-1 text-[#666666] hover:text-[#042509] cursor-pointer"
            >
              <Check size={12} className="text-[#042509]" />
              <span>{t('checkout.stepBag')}</span>
            </button>

            <span className="text-[#DCDCDC]">/</span>

            <button
              onClick={() => setStep('shipping')}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors cursor-pointer ${
                step === 'shipping'
                  ? 'bg-[#042509] text-white font-bold'
                  : 'text-[#666666] hover:text-[#042509]'
              }`}
            >
              {step === 'payment' ? <Check size={12} /> : null}
              <span>{t('checkout.stepAddress')}</span>
            </button>

            <span className="text-[#DCDCDC]">/</span>

            <div
              className={`px-2.5 py-1 ${
                step === 'payment'
                  ? 'bg-[#042509] text-white font-bold'
                  : 'text-[#666666]'
              }`}
            >
              <span>{t('checkout.stepPayment')}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Main Form Step Area */}
          <div ref={stepMotionRef} className="lg:col-span-7">
            {isDemo && (
              <PreviewNote className="mb-6">
                <strong>{t('checkout.simulation')}</strong> {t('checkout.simulationBody')}
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
                className="mt-6 p-5 border border-[#C91D1D]/30 bg-[#FBEAEA] space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-[#C91D1D] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-[#0A0A0A]">
                      Unable to place order
                    </h3>
                    <p className="text-xs font-mono text-[#666666] mt-1 leading-relaxed">
                      {orderError}. Your items and shipping details remain saved.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw size={13} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'Processing...' : 'Try again'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="px-4 py-2.5 bg-white border border-[#DCDCDC] text-[#0A0A0A] hover:border-[#042509] text-xs font-mono transition-colors cursor-pointer"
                  >
                    Edit destination
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

        {/* Confirmation Modal */}
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
