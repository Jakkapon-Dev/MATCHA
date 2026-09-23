import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { useLanguage } from '../context/LanguageContext.jsx';
import useChangeMotion from '../hooks/useChangeMotion';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ShippingStep from '../components/payment/ShippingStep';
import PaymentMethodStep from '../components/payment/PaymentMethodStep';
import OrderSummarySidebar from '../components/payment/OrderSummarySidebar';
import OrderSuccessModal from '../components/payment/OrderSuccessModal';
import { api, apiErrorText } from '../services/api';
import { useStoreMode } from '../context/StoreModeContext.jsx';
import { SHIPPING_OPTIONS as SHIPPING_RATES, shippingCostFor } from '../config/shipping';
import { bundleDiscountFor, couponFor, discountFor, normaliseCode, takePendingCoupon } from '../config/coupons';
import PreviewNote from '../components/ui/PreviewNote';
import { stripePromise } from '../lib/stripe';
import { QrCode, Truck, Shield, AlertTriangle, RotateCcw } from 'lucide-react';

// Stripe requires payment confirmation to be verified server-side (webhook), not
// just trusted from the browser — this polls briefly so the UI waits for that
// confirmation to land before declaring the order paid. See backend/routes/stripeWebhook.js.
const PAYMENT_POLL_ATTEMPTS = 5;
const PAYMENT_POLL_INTERVAL_MS = 1200;
// PromptPay needs real human time to open a banking app and scan — a card's instant
// approve/decline doesn't apply, so this window is much longer (~2 minutes total).
const QR_POLL_ATTEMPTS = 40;
const QR_POLL_INTERVAL_MS = 3000;
const CARD_PAYMENT_METHODS = ['visa', 'mastercard'];

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
  cardHolder: '',
};

export default function PaymentPage() {
  const { t, lang } = useLanguage();
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
  const [qrDisplay, setQrDisplay] = useState(null); // { imageUrl, amountThb } while a PromptPay QR is up
  const qrCancelRef = useRef(false);
  /* The order that is currently holding stock while its payment is still
     outstanding. Kept so an abandoned checkout can put the goods back
     immediately instead of waiting out the server's reservation window. */
  const pendingOrderRef = useRef(null);
  /* Set when an attempt ends without payment but the order is still alive:
     a declined card, a dismissed QR, a wait that timed out. The order keeps
     its stock until `paymentDeadline`, so the retry below is a real offer
     rather than a button that leads to a 409. */
  const [canRetryPayment, setCanRetryPayment] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState(null);
  const [checkoutRequestId] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // โหมดเดโมมีขั้นตอนของตัวเองและล้างตะกร้าทันทีที่ออเดอร์ถูกบันทึก
  // ถ้าปล่อยให้ guard นี้ทำงานด้วย หน้ายืนยันจะถูกเด้งทิ้งก่อนผู้ซื้อได้เห็นเลขออเดอร์
  useEffect(() => {
    // A completed order clears the cart before the receipt actions render.
    // Keep the checkout route alive long enough for "View your orders" to
    // navigate away; otherwise this guard wins the same tick and sends the
    // customer back to an empty cart.
    if (cartItems.length === 0 && !showSuccessModal && !createdOrder) {
      navigate('/cart');
    }
  }, [cartItems, showSuccessModal, createdOrder, navigate]);

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

  const discount = Math.round((discountFor(appliedCoupon, subtotal) + bundleDiscountFor(cartItems)) * 100) / 100;

  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = normaliseCode(couponCode);
    const coupon = couponFor(code);

    if (!coupon) {
      /* Naming the codes that do work turned one wrong guess into a working
         discount. MATCHA15 is advertised on the front page and sits in this
         box's own placeholder, so nothing is lost by leaving it out — but
         FREESHIP is published nowhere else, and this message was the only
         place it could be found. */
      setCouponError(t('checkout.promoInvalid'));
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

  // เปลี่ยนวิธีชำระเงินระหว่างที่มี QR ค้างอยู่ (เช่นกดเลือกวิธีอื่นแทนการกด "ยกเลิก")
  // ต้องเคลียร์สถานะ QR ทิ้งด้วย ไม่งั้นจะเห็น QR เก่าค้างเวลาเปลี่ยนกลับมาที่ qr อีกที
  const handleSelectPayment = (id) => {
    setSelectedPayment(id);
    if (id !== 'qr') setQrDisplay(null);
  };

  /* Dismissing the QR stops the wait; it does not throw the order away.

     The order is holding stock and stays payable until its deadline, so the
     customer can come straight back with the same QR — a banking app that
     asked for a re-login, a phone that locked, a code scanned a minute too
     late. Only when the window closes does the reconciler take the goods
     back. Giving up entirely is a separate, explicit choice below. */
  const handleCancelQr = () => {
    qrCancelRef.current = true;
    setQrDisplay(null);
    setIsProcessing(false);
    if (pendingOrderRef.current) setCanRetryPayment(true);
  };

  /* The customer is done with this order, not just with this attempt. Return
     the stock now rather than holding it for the rest of the window. */
  const handleAbandonOrder = async () => {
    const abandoned = pendingOrderRef.current;
    if (!abandoned) return;
    pendingOrderRef.current = null;
    setCanRetryPayment(false);
    setPaymentDeadline(null);
    await api.cancelOrder(abandoned).catch(() => {});
    showToast('ยกเลิกคำสั่งซื้อแล้ว สินค้าถูกคืนเข้าคลัง', 'info');
  };

  // รอ paymentStatus จาก webhook จริง แทนที่จะเชื่อผลจาก Stripe.js ฝั่ง browser ตรงๆ
  // isCancelled ให้ QR flow เลิกรอกลางคันได้ทันทีเมื่อลูกค้ากด "ยกเลิก"
  const waitForPaymentConfirmation = async (orderId, { attempts = PAYMENT_POLL_ATTEMPTS, intervalMs = PAYMENT_POLL_INTERVAL_MS, isCancelled } = {}) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (isCancelled?.()) return null;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      if (isCancelled?.()) return null;
      const check = await api.getOrderById(orderId).catch(() => null);
      if (check?.data && check.data.paymentStatus === 'paid') return check.data;
    }
    return null;
  };

  const handlePlaceOrder = async ({ stripe, cardElement } = {}) => {
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
          image: item.image || '',
          isBundleItem: Boolean(item.isBundleItem)
        })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod: selectedPayment,
        shippingOption: selectedShipping,
        locale: lang
      };

      const res = await api.createOrder(orderPayload);
      if (!res || res.success === false || !res.data) {
        throw new Error(res?.message || 'เซิร์ฟเวอร์ไม่ได้ยืนยันการสร้างออเดอร์');
      }
      let order = res.data;
      const orderId = order.orderId || order._id;
      // Stock is now reserved against this order until it is paid or released.
      pendingOrderRef.current = orderId;
      setCanRetryPayment(false);

      const finishSuccess = (finalOrder) => {
        // Paid, or at least in the shop's hands: no longer ours to release.
        pendingOrderRef.current = null;
        setCanRetryPayment(false);
        setPaymentDeadline(null);
        setCreatedOrder(finalOrder);
        showToast(
          finalOrder.paymentStatus === 'paid'
            ? 'ชำระเงินสำเร็จ! รับคำสั่งซื้อเรียบร้อยแล้ว'
            : 'รับคำสั่งซื้อเรียบร้อยแล้ว (สถานะ: รอดำเนินการ / รอชำระเงิน)',
          'success'
        );
        setShowSuccessModal(true);
        clearCart();
      };

      if (CARD_PAYMENT_METHODS.includes(selectedPayment)) {
        if (!stripe || !cardElement) {
          throw new Error('ระบบชำระเงินยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
        }

        const intentRes = await api.createPaymentIntent(orderId);
        if (!intentRes || intentRes.success === false || !intentRes.data?.clientSecret) {
          throw new Error(intentRes?.message || 'ไม่สามารถเริ่มการชำระเงินได้');
        }

        if (intentRes.data.paymentExpiresAt) setPaymentDeadline(intentRes.data.paymentExpiresAt);

        const { error: stripeError } = await stripe.confirmCardPayment(intentRes.data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardData.cardHolder.trim() || undefined }
          }
        });

        if (stripeError) {
          /* The order survives a decline, still holding its stock until the
             deadline. Reaching for another card is the common next move, and
             taking the garment away mid-checkout would turn that retry into
             an out-of-stock. */
          setCanRetryPayment(true);
          throw new Error(stripeError.message || 'บัตรถูกปฏิเสธ กรุณาลองบัตรใบอื่น');
        }

        // Stripe confirmed on the client — the order is only truly "paid" once
        // our webhook receives Stripe's own server-to-server confirmation.
        const confirmedOrder = await waitForPaymentConfirmation(orderId);
        if (confirmedOrder) order = confirmedOrder;
      } else if (selectedPayment === 'qr') {
        if (!stripe) {
          throw new Error('ระบบชำระเงินยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
        }

        const intentRes = await api.createPaymentIntent(orderId);
        if (!intentRes || intentRes.success === false || !intentRes.data?.clientSecret) {
          throw new Error(intentRes?.message || 'ไม่สามารถเริ่มการชำระเงินได้');
        }

        if (intentRes.data.paymentExpiresAt) setPaymentDeadline(intentRes.data.paymentExpiresAt);

        const { error: stripeError, paymentIntent } = await stripe.confirmPromptPayPayment(intentRes.data.clientSecret, {
          payment_method: {
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`.trim() || undefined,
              email: formData.email
            }
          }
        });

        if (stripeError) {
          throw new Error(stripeError.message || 'ไม่สามารถสร้าง QR PromptPay ได้ กรุณาลองใหม่อีกครั้ง');
        }

        console.log('[Stripe PromptPay] status:', paymentIntent?.status, 'next_action type:', paymentIntent?.next_action?.type || 'ไม่มี');

        // Stripe test mode มักยืนยัน PromptPay "สำเร็จ" เกือบจะทันทีโดยไม่ต้องสแกนจริง — ถึงตอนที่
        // เรามาเช็ค next_action การจ่ายเงินอาจจบไปแล้ว จึงไม่มี QR ให้โชว์เลย (ไม่ใช่ error) ข้ามการ
        // แสดง QR แล้วรอ webhook ยืนยันสั้นๆ แบบเดียวกับบัตรได้เลย
        if (paymentIntent?.status === 'succeeded') {
          const confirmedOrder = await waitForPaymentConfirmation(orderId);
          if (confirmedOrder) order = confirmedOrder;
          finishSuccess(order);
          return;
        }

        // ปกติ (นอก test mode) PaymentIntent จะค้างที่ requires_action พร้อมข้อมูล QR ให้สแกน —
        // next_action บางครั้งยังไม่ populate ทันทีที่ confirm กลับมา ลอง retrieve ซ้ำอีกครั้งก่อน
        let qrAction = paymentIntent?.next_action?.promptpay_display_qr_code;
        let latestStatus = paymentIntent?.status;
        let latestActionType = paymentIntent?.next_action?.type;

        if (!qrAction?.image_url_png && !qrAction?.image_url_svg && !qrAction?.hosted_instructions_url) {
          const retrieved = await stripe.retrievePaymentIntent(intentRes.data.clientSecret).catch(() => null);
          const retrievedIntent = retrieved?.paymentIntent;

          if (retrievedIntent?.status === 'succeeded') {
            const confirmedOrder = await waitForPaymentConfirmation(orderId);
            if (confirmedOrder) order = confirmedOrder;
            finishSuccess(order);
            return;
          }

          if (retrievedIntent?.next_action?.promptpay_display_qr_code) {
            qrAction = retrievedIntent.next_action.promptpay_display_qr_code;
            latestStatus = retrievedIntent.status;
            latestActionType = retrievedIntent.next_action.type;
          }
        }

        const qrImageUrl = qrAction?.image_url_png || qrAction?.image_url_svg || null;
        const qrHostedUrl = qrAction?.hosted_instructions_url || null;

        if (!qrImageUrl && !qrHostedUrl) {
          throw new Error(`ไม่ได้รับ QR code จาก Stripe (สถานะ: ${latestStatus || 'ไม่ทราบ'}, next_action: ${latestActionType || 'ไม่มี'}) — เปิด console ดูรายละเอียดเพิ่มเติม แล้วลองใหม่อีกครั้ง`);
        }

        qrCancelRef.current = false;
        setQrDisplay({ imageUrl: qrImageUrl, hostedUrl: qrHostedUrl, amountThb: intentRes.data.thbAmount ?? 0 });

        const confirmedOrder = await waitForPaymentConfirmation(orderId, {
          attempts: QR_POLL_ATTEMPTS,
          intervalMs: QR_POLL_INTERVAL_MS,
          isCancelled: () => qrCancelRef.current
        });

        if (qrCancelRef.current) {
          // ลูกค้ากด "ยกเลิก" เอง — ไม่ใช่ความล้มเหลว ไม่ต้องแจ้ง error หรือ success ใดๆ
          return;
        }

        setQrDisplay(null);

        if (!confirmedOrder) {
          // ยังไม่ได้รับการยืนยันภายในเวลาที่รอ — ไม่ใช่ error แค่ยังไม่จ่าย webhook จะอัปเดต
          // สถานะให้เองเมื่อลูกค้าสแกนจ่ายจริง (เช็คสถานะย้อนหลังได้ที่หน้าประวัติคำสั่งซื้อ)
          setCanRetryPayment(true);
          showToast('ยังไม่ได้รับการยืนยันการชำระเงิน กรุณาตรวจสอบสถานะออเดอร์ภายหลังในหน้าประวัติคำสั่งซื้อ', 'info');
          return;
        }

        order = confirmedOrder;
      }

      finishSuccess(order);
    } catch (err) {
      // ออเดอร์ที่เซิร์ฟเวอร์ปฏิเสธคือออเดอร์ที่ไม่เกิดขึ้น — อย่าบอกลูกค้าว่าสำเร็จ
      console.error('Order creation failed:', err.message);
      const message = apiErrorText(err, t);
      showToast(message, 'error');
      setOrderError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // โหมดทดลองใช้ฟอร์มกรอกที่อยู่และบัตรชุดเดียวกับโหมดร้านจริง เพื่อให้ผู้ที่มาลองใช้
  // เห็นขั้นตอนการสั่งซื้อครบตามจริง — ต่างกันแค่ไม่มีการจัดส่งจริง (การตัดเงินด้วยบัตร
  // เชื่อมกับ Stripe จริงในโหมดทดสอบ) เลขบัตรพิมพ์เข้า Stripe Elements โดยตรง
  // (iframe ของ Stripe) ไม่เคยผ่านโค้ดหรือ state ของแอปนี้เลย
  return (
    <Elements stripe={stripePromise}>
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
                onSelectPayment={handleSelectPayment}
                cardData={cardData}
                onCardDataChange={setCardData}
                onBack={() => setStep('shipping')}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                totalAmount={total}
                qrDisplay={qrDisplay}
                onCancelQr={handleCancelQr}
                canRetryPayment={canRetryPayment}
                paymentDeadline={paymentDeadline}
                onAbandonOrder={handleAbandonOrder}
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
    </Elements>
  );
}
