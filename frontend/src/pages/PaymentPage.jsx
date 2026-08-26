import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ShippingStep from '../components/payment/ShippingStep';
import PaymentMethodStep from '../components/payment/PaymentMethodStep';
import OrderSummarySidebar from '../components/payment/OrderSummarySidebar';
import OrderSuccessModal from '../components/payment/OrderSuccessModal';
import { QrCode, Truck, Shield } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa', icon: '💳' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'qr', name: 'PromptPay QR', icon: <QrCode size={20} /> },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Express Shipping', price: 0, days: '3-5 business days' },
  { id: 'express', name: 'Priority Courier Shipping', price: 12.00, days: '1-2 business days' },
  { id: 'premium', name: 'VIP Same-Day Delivery', price: 25.00, days: 'Guaranteed 24 Hours' },
];

const COUPONS = {
  '01': { discount: 10, type: 'percent', label: '10% OFF' },
  '02': { discount: 20, type: 'percent', label: '20% OFF' },
  '03': { discount: 50, type: 'percent', label: '50% OFF' },
  'MATCHA15': { discount: 15, type: 'percent', label: '15% OFF' },
  'WELCOME10': { discount: 10, type: 'percent', label: '10% OFF' },
  'FREESHIP': { discount: 0, type: 'free_shipping', label: 'Free Shipping' },
};

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

  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment'
  const [selectedPayment, setSelectedPayment] = useState('visa');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [formData, setFormData] = useState(initialFormData);
  const [cardData, setCardData] = useState(initialCardData);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !showSuccessModal) {
      navigate('/cart');
    }
  }, [cartItems, showSuccessModal, navigate]);

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const selectedShippingOption = SHIPPING_OPTIONS.find((s) => s.id === selectedShipping);
  const shippingCost = appliedCoupon?.type === 'free_shipping' || subtotal >= 100 
    ? 0 
    : (selectedShippingOption?.price || 0);

  const discount = appliedCoupon?.type === 'percent' 
    ? subtotal * (appliedCoupon.discount / 100) 
    : 0;

  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    const coupon = COUPONS[code];

    if (!coupon) {
      setCouponError('Invalid promo code. Try MATCHA15 or FREESHIP');
      return;
    }

    setAppliedCoupon({ ...coupon, code });
    showToast(`Applied coupon: ${code} (${coupon.label}) 🎉`);
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    showToast('Removed promotional coupon.');
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccessModal(true);
      clearCart();
    }, 1200);
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Step Indicator Header */}
        <div className="mb-10 pb-6 border-b border-[#D9D3C7] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-widest">
              Checkout Flow
            </span>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-[#2D231E] tracking-tight mt-1">
              {step === 'shipping' ? 'Shipping Details' : 'Payment Method'}
            </h1>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-3 py-1 rounded-lg font-bold ${
              step === 'shipping' ? 'bg-[#2D5A27] text-white' : 'bg-[#D0DEC6] text-[#2D5A27]'
            }`}>
              1. Address
            </span>
            <span className="text-[#D9D3C7]">→</span>
            <span className={`px-3 py-1 rounded-lg font-bold ${
              step === 'payment' ? 'bg-[#2D5A27] text-white' : 'bg-white border border-[#D9D3C7] text-[#6B5E55]'
            }`}>
              2. Payment
            </span>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Steps (Left Column) */}
          <div className="lg:col-span-7">
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
                onBack={() => setStep('shipping')}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                totalAmount={total}
              />
            )}
          </div>

          {/* Order Summary Sidebar (Right Column) */}
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

        {/* Order Confirmation Receipt Modal */}
        <OrderSuccessModal
          isOpen={showSuccessModal}
          formData={formData}
          totalAmount={total}
          onDone={() => setShowSuccessModal(false)}
        />

      </div>
    </div>
  );
}
