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
import DemoCheckout from '../features/demo/DemoCheckout';
import { QrCode, Truck, Shield, AlertTriangle, RotateCcw } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa', icon: '💳' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'qr', name: 'PromptPay QR', icon: <QrCode size={20} /> },
];

// ชื่อและระยะเวลาเป็นเรื่องของหน้าจอ ส่วนราคามาจากตารางกลางที่ตรงกับเซิร์ฟเวอร์
const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Express Shipping', price: SHIPPING_RATES.standard, days: '3-5 business days' },
  { id: 'express', name: 'Priority Courier Shipping', price: SHIPPING_RATES.express, days: '1-2 business days' },
  { id: 'premium', name: 'VIP Same-Day Delivery', price: SHIPPING_RATES.premium, days: 'Guaranteed 24 Hours' },
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

  // โหมดเดโมมีขั้นตอนของตัวเองและล้างตะกร้าทันทีที่ออเดอร์ถูกบันทึก
  // ถ้าปล่อยให้ guard นี้ทำงานด้วย หน้ายืนยันจะถูกเด้งทิ้งก่อนผู้ซื้อได้เห็นเลขออเดอร์
  useEffect(() => {
    if (!isDemo && cartItems.length === 0 && !showSuccessModal) {
      navigate('/cart');
    }
  }, [isDemo, cartItems, showSuccessModal, navigate]);

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const shippingCost = shippingCostFor(subtotal, selectedShipping, {
    freeShippingCoupon: appliedCoupon?.type === 'free_shipping'
  });

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

  const handlePlaceOrder = async () => {
    setOrderError(null);
    setIsProcessing(true);
    try {
      // ราคาไม่ได้ส่งไปแล้ว — เซิร์ฟเวอร์คิดเองจากราคาใน DB และโค้ดส่วนลดที่ส่งไป
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
        throw new Error(res?.message || 'เซิร์ฟเวอร์ไม่ได้ยืนยันการสร้างออเดอร์');
      }
      setCreatedOrder(res.data);
      showToast('รับคำสั่งซื้อเรียบร้อยแล้ว (สถานะ: รอดำเนินการ / รอชำระเงิน)', 'success');
      setShowSuccessModal(true);
      clearCart();
    } catch (err) {
      // ออเดอร์ที่เซิร์ฟเวอร์ปฏิเสธคือออเดอร์ที่ไม่เกิดขึ้น — อย่าบอกลูกค้าว่าสำเร็จ
      console.error('Order creation failed:', err.message);
      showToast(err.message || 'Could not place the order. Please try again.', 'error');
      setOrderError(err.message || 'ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isDemo) return <DemoCheckout />;
  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Step Indicator Header */}
        <div className="mb-10 pb-6 border-b border-[#D9D3C7] flex items-center justify-between">
          <div>
            <span data-enter className="text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-widest">
              Checkout Flow
            </span>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-2xl sm:text-4xl font-black uppercase text-[#2D231E] tracking-tight mt-1">
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
          <div ref={stepMotionRef} className="lg:col-span-7">
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

            {step === 'payment' && orderError && (
              <div
                role="alert"
                className="mt-6 p-6 rounded-2xl border border-[#D9D3C7] bg-[#FAF8F5] shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#D9D3C7] text-[#BC5A36] shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#BC5A36] block">
                      ORDER NOT PLACED
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#2D231E] mt-0.5">
                      ออเดอร์ยังไม่ถูกสร้าง
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#D9D3C7] bg-white text-xs font-mono text-[#BC5A36] break-words">
                  {orderError}
                </div>

                <p className="text-xs text-[#6B5E55] leading-relaxed">
                  สินค้าในตะกร้าและข้อมูลที่คุณกรอกไว้ยังอยู่ครบถ้วน ไม่มีการตัดเงินเกิดขึ้น
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'กำลังดำเนินการ...' : 'ลองสั่งซื้ออีกครั้ง'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3 bg-white border border-[#D9D3C7] text-[#6B5E55] hover:text-[#2D231E] hover:border-[#2D231E] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                  >
                    กลับไปแก้ข้อมูลจัดส่ง
                  </button>
                </div>
              </div>
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
