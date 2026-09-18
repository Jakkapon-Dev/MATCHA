import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { SHIPPING_OPTIONS as SHIPPING_RATES } from '../../config/shipping';

export default function DemoCheckout() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState('standard');
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  // PaymentPage ปล่อยเรื่องตะกร้าว่างให้หน้านี้จัดการเอง: มาถึงโดยไม่มีของและยังไม่มี
  // ออเดอร์ ก็ส่งกลับไปตะกร้า แต่หลังสั่งสำเร็จต้องอยู่ต่อเพื่อให้เห็นเลขออเดอร์
  useEffect(() => {
    if (!order && cartItems.length === 0) navigate('/cart');
  }, [order, cartItems.length, navigate]);
  async function placeOrder() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const payload = { items: cartItems.map(i => ({ productId: i.id || i.productId, quantity: Number(i.quantity), size: i.size || '', color: i.color || '' })), couponCode: coupon.trim().toUpperCase() || null, shippingOption: shipping, paymentMethod: 'demo' };
      const fingerprint = JSON.stringify(payload);
      let request;
      try { request = JSON.parse(sessionStorage.getItem('matcha_demo_checkout') || 'null'); } catch { request = null; }
      if (!request || request.fingerprint !== fingerprint) {
        request = { fingerprint, key: crypto.randomUUID() };
        sessionStorage.setItem('matcha_demo_checkout', JSON.stringify(request));
      }
      let orderResult;
      try {
        const response = await api.createOrder({ ...payload, idempotencyKey: request.key });
        if (!response.data?.isDemo) throw new Error('โหมดร้านเปลี่ยนแล้ว กรุณาโหลดใหม่');
        orderResult = response.data;
      } catch (backendErr) {
        const isNetworkErr = backendErr.message && (
          backendErr.message.includes('ติดต่อเซิร์ฟเวอร์ไม่ได้') ||
          backendErr.message.includes('Failed to communicate') ||
          backendErr.message.includes('Failed to fetch') ||
          backendErr.message.includes('NetworkError')
        );
        if (!isNetworkErr) throw backendErr;

        const subtotal = cartItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
        const discount = coupon.trim().toUpperCase() === 'MATCHA15' ? subtotal * 0.15 : 0;
        const shippingCost = (subtotal - discount) >= 100 ? 0 : (SHIPPING_RATES[shipping] ?? 0);
        const total = Math.round((subtotal - discount + shippingCost) * 100) / 100;
        orderResult = {
          isDemo: true,
          orderId: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          total,
          items: cartItems
        };
      }
      setOrder(orderResult);
      clearCart();
      sessionStorage.removeItem('matcha_demo_checkout');
    } catch (e) { setError(e.message || 'ยังสร้างออเดอร์ทดลองไม่ได้ กรุณาลองใหม่'); }
    finally { setBusy(false); }
  }
  function finish() { navigate('/catalog'); }
  return <section className="max-w-3xl mx-auto p-5 sm:p-10 my-8 bg-white border border-[#DCDCDC] rounded-2xl text-[#000000]">
    <h1 className="text-2xl sm:text-3xl font-bold">{order ? 'สร้างออเดอร์ทดลองสำเร็จ' : 'ทดลองสั่งซื้อ'}</h1>
    <p className="my-4 text-sm leading-relaxed">ใช้ผู้รับและที่อยู่ตัวอย่าง ไม่ต้องกรอกข้อมูลส่วนตัว เลขบัตร หรือโอนเงิน ไม่มีการจัดส่งจริง</p>
    {order ? <div role="status" className="space-y-4"><p className="break-all">เลขออเดอร์: <strong>{order.orderId}</strong></p><p>ยอดจำลอง: ${order.total.toFixed(2)} · ไม่มีการชำระเงินจริง</p><button className="px-5 py-3 rounded-xl bg-[#042509] text-white hover:bg-[#021505]" onClick={finish}>กลับไปเลือกสินค้า</button></div> : <>
      <p className="p-4 bg-[#F1F1F1] rounded-xl">ผู้รับ: Demo Customer · ที่อยู่ตัวอย่าง</p>
      <ul className="my-5 divide-y divide-[#DCDCDC]">{cartItems.map((i, index) => <li key={index} className="py-3 flex justify-between gap-4"><span>{i.name}<small className="block">{i.size} · {i.color} · {i.quantity} ชิ้น</small></span><span>${(i.price * i.quantity).toFixed(2)}</span></li>)}</ul>
      <label className="block my-4">รูปแบบจัดส่งจำลอง<select value={shipping} disabled={busy} onChange={e => setShipping(e.target.value)} className="block w-full border rounded-lg p-3 mt-2"><option value="standard">มาตรฐาน — ${SHIPPING_RATES.standard}</option><option value="express">ด่วน — ${SHIPPING_RATES.express}</option><option value="premium">พรีเมียม — ${SHIPPING_RATES.premium}</option></select></label>
      <label className="block my-4">โค้ดส่วนลดทดลอง<input value={coupon} disabled={busy} maxLength={30} placeholder="เช่น MATCHA15" onChange={e => setCoupon(e.target.value)} className="block w-full border rounded-lg p-3 mt-2" /></label>
      <p className="text-sm my-3">ระบบคำนวณราคาปัจจุบันและส่วนลดให้ก่อนบันทึกออเดอร์ทดลอง</p>
      {error && <p role="alert" className="p-4 mb-4 rounded-xl bg-red-50 text-red-900">{error}</p>}
      <button disabled={busy || !cartItems.length} onClick={placeOrder} className="px-5 py-3 rounded-xl bg-[#042509] text-white hover:bg-[#021505] disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'สร้างออเดอร์ทดลอง — ไม่เสียเงินจริง'}</button>
    </>}
  </section>;
}
