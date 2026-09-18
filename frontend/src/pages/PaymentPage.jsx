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
import { QrCode, AlertTriangle, RotateCcw } from 'lucide-react';

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
    if (cartItems.length === 0 && !showSuccessModal) {
      navigate('/cart');
    }
  }, [cartItems, showSuccessModal, navigate]);

  /* คูปองที่ผู้ใช้กดรับไว้จากหน้าโปรโมชัน ใส่ให้อัตโนมัติตอนเปิดหน้านี้
   *
   * takePendingCoupon อ่านแล้วลบทิ้งในจังหวะเดียว และเทียบรหัสกับตารางใหม่
   * ก่อนคืนค่า ค่าที่ถูกแก้มาจึงกลายเป็น null ไม่ใช่ส่วนลดที่ผู้ใช้ตั้งเอง
   *
   * ต้องบอกด้วยว่าใส่ให้แล้ว ไม่ใช่ลดเงียบ ๆ — ยอดที่เปลี่ยนไปเองโดยไม่มีคำอธิบาย
   * อ่านเหมือนคิดเงินผิดมากกว่าเหมือนได้ส่วนลด */
  useEffect(() => {
    const pending = takePendingCoupon();
    if (!pending) return;
    setAppliedCoupon(pending);
    showToast(`ใส่คูปอง ${pending.code} (${pending.label}) ให้แล้ว`, 'success');
  }, [showToast]);

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const shippingCost = shippingCostFor(subtotal, selectedShipping, {
    freeShippingCoupon: appliedCoupon?.type === 'free_shipping'
  });

  // ปัดเศษด้วยกฎเดียวกับเซิร์ฟเวอร์ ไม่งั้นยอดพรีวิวกับยอดที่เรียกเก็บจะต่างกันเศษสตางค์
  const discount = discountFor(appliedCoupon, subtotal);

  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = normaliseCode(couponCode);
    const coupon = couponFor(code);

    if (!coupon) {
      // รหัสตัวอย่างดึงจาก config ไม่ได้พิมพ์ซ้ำไว้ตรงนี้ จะได้ไม่ลืมแก้ตอนเปลี่ยนโปรโมชัน
      setCouponError(`Invalid promo code. Try ${FEATURED_CODES.join(' or ')}`);
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

  // โหมดทดลองใช้ฟอร์มกรอกที่อยู่และบัตรชุดเดียวกับโหมดร้านจริง เพื่อให้ผู้ที่มาลองใช้
  // เห็นขั้นตอนการสั่งซื้อครบตามจริง — ต่างกันแค่ไม่มีการตัดเงินและไม่มีการจัดส่ง
  // เลขบัตรอยู่ใน state ของหน้านี้เท่านั้น ไม่ถูกส่งไปกับ orderPayload และไม่ถูกบันทึกที่ใด
  return (
    <div className="w-full bg-[#F1F1F1] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Step Indicator Header */}
        <div className="mb-10 pb-6 border-b border-[#DCDCDC] flex items-center justify-between">
          <div>
            <span data-enter className="text-xs font-mono font-bold text-[#042509] uppercase tracking-widest">
              Checkout Flow
            </span>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-2xl sm:text-4xl font-black uppercase text-[#000000] tracking-tight mt-1">
              {step === 'shipping' ? 'Shipping Details' : 'Payment Method'}
            </h1>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-3 py-1 rounded-lg font-bold ${
              step === 'shipping' ? 'bg-[#042509] text-white' : 'bg-[#518F5C] text-[#042509]'
            }`}>
              1. Address
            </span>
            <span className="text-[#DCDCDC]">→</span>
            <span className={`px-3 py-1 rounded-lg font-bold ${
              step === 'payment' ? 'bg-[#042509] text-white' : 'bg-white border border-[#DCDCDC] text-[#666666]'
            }`}>
              2. Payment
            </span>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Steps (Left Column) */}
          <div ref={stepMotionRef} className="lg:col-span-7">
            {isDemo && (
              <PreviewNote className="mb-5">
                <strong>โหมดทดลอง</strong> — ขั้นตอนและฟอร์มเหมือนการสั่งซื้อจริงทุกอย่าง
                แต่ไม่มีการตัดเงินและไม่มีการจัดส่ง
                <br />
                กรุณา<strong>ใช้ข้อมูลสมมติเท่านั้น</strong> อย่ากรอกเลขบัตรจริง
                (เลขบัตรที่กรอกอยู่ในหน้าจอนี้เท่านั้น ไม่ถูกส่งออกและไม่ถูกบันทึกที่ใด)
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
                onBack={() => setStep('shipping')}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                totalAmount={total}
              />
            )}

            {step === 'payment' && orderError && (
              <div
                role="alert"
                className="mt-6 p-6 rounded-2xl border border-[#DCDCDC] bg-[#F1F1F1] shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#DCDCDC] text-[#C91D1D] shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C91D1D] block">
                      ORDER NOT PLACED
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#000000] mt-0.5">
                      ออเดอร์ยังไม่ถูกสร้าง
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#DCDCDC] bg-white text-xs font-mono text-[#C91D1D] break-words">
                  {orderError}
                </div>

                <p className="text-xs text-[#666666] leading-relaxed">
                  สินค้าในตะกร้าและข้อมูลที่คุณกรอกไว้ยังอยู่ครบถ้วน ไม่มีการตัดเงินเกิดขึ้น
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-[#042509] hover:bg-[#021505] text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'กำลังดำเนินการ...' : 'ลองสั่งซื้ออีกครั้ง'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3 bg-white border border-[#DCDCDC] text-[#666666] hover:text-[#000000] hover:border-[#000000] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
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
