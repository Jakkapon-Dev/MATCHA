# MatchA Full-Stack Codebase Master Blueprint & Function Deep Dive (Alldata.md)

> **คู่มือรหัสโค้ด, คำอธิบายฟังก์ชันทีละบรรทัด, ตารางตัวแปร, State, Props, Data Flow & Variable Traceability ฉบับสมบูรณ์**  
> สถาปัตยกรรม: React 18 (Vite) · Tailwind CSS v4 · React Context API · Express.js · Lenis Smooth Scroll · Lucide Icons

---

## 📌 สารบัญ (Table of Contents)
1. [ภาพรวมสถาปัตยกรรม & แผนผัง Variable Data Flow](#1-ภาพรวมสถาปัตยกรรม--แผนผัง-variable-data-flow)
2. [Global Context Layer (State ส่วนกลางของทั้งระบบ)](#2-global-context-layer)
   - 2.1 [`CartContext.jsx`](#21-cartcontextjsx--ระบบจัดการตะกร้าสินค้าและคำนวณราคา) (เจาะลึก `getCartKey`, `addToCart`, `updateQty`, `removeItem`, `clearCart`)
   - 2.2 [`AuthContext.jsx`](#22-authcontextjsx--ระบบจัดการสถานะผู้ใช้และสิทธิ์-rbac) (เจาะลึก `login`, `logout`, `isAdmin`, `isAuthenticated`)
   - 2.3 [`ToastContext.jsx`](#23-toastcontextjsx--ระบบป๊อปอัปแจ้งเตือนส่วนกลาง) (เจาะลึก `showToast`, `hideToast`, Auto-dismiss timer)
3. [Root & Global Routing (`App.jsx` & `Layout.jsx`)](#3-root--global-routing-appjsx--layoutjsx) (เจาะลึก `Lenis Smooth Scroll Engine` และ Routing Structure)
4. [หน้าแคตตาล็อกสินค้า & ตัวกรองแนวนอน (`CatalogPage.jsx` & `TopFilterBar.jsx`)](#4-หน้าแคตตาล็อกสินค้า--ตัวกรองแนวนอน) (เจาะลึก Filter Engine, Color Swatches Popover & Event Isolation)
5. [คอมโพเนนต์การ์ดสินค้า & หน้าต่างพรีวิว (`ProductCard.jsx` & `ProductModal.jsx`)](#5-คอมโพเนนต์การ์ดสินค้า--หน้าต่างพรีวิว) (เจาะลึก `handleWishlistClick`, Centered Quick View & Aspect Ratio Contain)
6. [หน้าตะกร้าสินค้า & ตัววัดยอดส่งฟรี (`CartPage.jsx`)](#6-หน้าตะกร้าสินค้า--ตัววัดยอดส่งฟรี) (เจาะลึก `freeShippingPercent` & Table Rendering)
7. [ระบบชำระเงิน & คำนวณส่วนลด (`Payment.jsx` & Sub-Components)](#7-ระบบชำระเงิน--คำนวณส่วนลด) (เจาะลึก `handleApplyCoupon`, Client-side Validation & Multi-step State)
8. [ระบบสมาชิก & โปรไฟล์ผู้ใช้ (`LoginPage.jsx` & `UserAccount.jsx`)](#8-ระบบสมาชิก--โปรไฟล์ผู้ใช้) (เจาะลึก `handleQuickDemoLogin`, Password Validation & Tab Navigation)
9. [หน้าผู้ดูแลระบบระดับสูง (`AdminPage.jsx` — Executive Command Dashboard)](#9-หน้าผู้ดูแลระบบระดับสูง-adminpagejsx) (เจาะลึก `downloadFile (UTF-8 BOM)`, `handleRestock`, Multi-Tier Search/Filter & KPI Engine)
10. [Service Layer & API Resilience (`api.js` & `productsData.js`)](#10-service-layer--api-resilience) (เจาะลึก `fetchWithFallback` & Graceful Degradation)

---

## 1. ภาพรวมสถาปัตยกรรม & แผนผัง Variable Data Flow

```mermaid
graph TD
    subgraph Global Context Pipeline
        A[ToastContext: showToast] --> B[AuthContext: currentUser, isAdmin]
        B --> C[CartContext: cartItems, subtotal, shipping, total]
    end

    subgraph Catalog & Product Flow
        D[TopFilterBar: season, color, fit, price] --> E[CatalogPage: filteredProducts]
        E --> F[ProductCard: activeVariant, selectedSize]
        F -->|onClick Heart & Check currentUser| G[Toast: กรุณาล็อกอิน / Wishlist Update]
        F -->|onClick Quick View| H[ProductModal: Global Preview]
        F -->|onClick Add to Cart| I[CartContext.addToCart: getCartKey]
    end

    subgraph Cart & Checkout Flow
        I --> J[LocalStorage: matcha_cart]
        J --> K[CartPage: cartItems Table]
        K --> L[Payment.jsx: shippingStep + paymentStep]
        L --> M[OrderSummarySidebar: subtotal - couponDiscount + shipping]
        M --> N[OrderSuccessModal: clearCart]
    end

    subgraph Admin Management
        B -->|Check isAdmin| O[AdminPage: Executive Dashboard]
        O --> P[Inventory State + Orders State + VIP Members State]
        P --> Q[Export Center: CSV UTF-8 BOM / JSON Backup]
    end
```

---

## 2. Global Context Layer

---

### 2.1 `CartContext.jsx` — ระบบจัดการตะกร้าสินค้าและคำนวณราคา

#### 💻 โค้ดหลัก (Source Code):
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();

  // ดึงตะกร้าเดิมจาก LocalStorage เมื่อโหลดแอปครั้งแรก
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('matcha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // บันทึกลง LocalStorage ทุกครั้งที่ cartItems เปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem('matcha_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to persist cart:', err);
    }
  }, [cartItems]);

  // ฟังก์ชันสร้าง Compound Key: id-size-color
  const getCartKey = (item) => {
    const id = item?.id || 'unknown';
    const size = item?.size || 'M';
    const color = item?.color || 'Signature';
    return `${id}-${size}-${color}`;
  };

  // ฟังก์ชันเพิ่มสินค้าลงตะกร้า
  const addToCart = (product, customQty = null) => {
    const qtyToAdd = customQty !== null ? Number(customQty) : (product?.quantity ? Number(product.quantity) : 1);
    
    setCartItems((prev) => {
      const targetKey = getCartKey(product);
      const existingIndex = prev.findIndex((item) => getCartKey(item) === targetKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd
        };
        return updated;
      }

      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    showToast(`Added "${product?.name || 'Garment'}" to bag!`, 'success');
  };

  // ฟังก์ชันปรับจำนวน (+1 / -1) และลบอัตโนมัติหากเหลือ 0
  const updateQty = (key, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (getCartKey(item) === key) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // ฟังก์ชันลบสินค้า
  const removeItem = (key) => {
    setCartItems((prev) => prev.filter((item) => getCartKey(item) !== key));
    showToast('Item removed from bag', 'info');
  };

  // ฟังก์ชันล้างตะกร้า
  const clearCart = () => setCartItems([]);

  // การคำนวณยอดเงินและจำนวนชิ้น
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const shipping = subtotal >= 100 || cartItems.length === 0 ? 0 : 10;
  const total = subtotal + shipping;
  const awayFromFreeShipping = Math.max(0, 100 - subtotal);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQty, removeItem, clearCart,
      getCartKey, cartCount, subtotal, shipping, total, awayFromFreeShipping
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน (Function-by-Function Breakdown):

##### 1. ฟังก์ชัน `getCartKey(item)`
* **หน้าที่หลัก:** สร้าง Unique Compound Key ประจำตัวสินค้าแต่ละชิ้นในตะกร้า
* **Input / Output:**
  * *รับเข้า (Param):* `item` (Object สินค้าที่มี `id`, `size`, `color`)
  * *ส่งออก (Return):* `String` ในรูปแบบ `${id}-${size}-${color}` (เช่น `"AUT-TOP-001-L-Matcha Green"`)
* **การทำงานทีละบรรทัด:**
  1. ดึง `id` ออกมา หากไม่มีให้ใส่ `'unknown'` ป้องกัน error
  2. ดึง `size` ออกมา หากไม่ได้เลือกให้ fallback เป็นไซส์ `'M'`
  3. ดึง `color` ออกมา หากไม่ได้เลือกให้ fallback เป็น `'Signature'`
  4. นำทั้ง 3 ค่ามาต่อกันด้วยขีด (`-`) แล้วส่งกลับไป
* **ทำไมต้องเขียนแบบนี้:** ป้องกัน **Collision Bug** ที่สินค้า ID เดียวกัน แต่ผู้ใช้สั่งคนละไซส์หรือคนละสี แล้วถูกนับรวมทับกันเป็นรายการเดียว

##### 2. ฟังก์ชัน `addToCart(product, customQty)`
* **หน้าที่หลัก:** เพิ่มสินค้าลงตะกร้า หรือเพิ่มจำนวนในรายการเดิมที่มีอยู่แล้ว
* **Input / Output:**
  * *รับเข้า (Param):* `product` (Object ข้อมูลสินค้า) และ `customQty` (จำนวนที่ต้องการเพิ่ม หรือ null)
  * *ส่งออก (Return):* `void` (อัปเดต State `cartItems` และสั่งแสดง Toast)
* **การทำงานทีละบรรทัด:**
  1. แปลงค่า `qtyToAdd` ให้เป็นตัวเลข `Number` ป้องกัน String Concatenation (`1 + "1" = "11"`)
  2. เรียก `setCartItems(prev => ...)` โดยใช้ Callback รูปแบบ Functional Update
  3. นำสินค้าไปแปลงเป็น Unique Key ด้วย `getCartKey(product)`
  4. ใช้ `.findIndex()` วนหาในตะกร้าเดิมว่ามี Key นี้อยู่แล้วหรือไม่
  5. หากพบ (`existingIndex > -1`) จะทำการ Copy Array แบบ Immutability (`[...prev]`) แล้วบวก `quantity` เพิ่มในช่องนั้น
  6. หากไม่พบ จะต่อท้าย Array ใหม่ด้วย Spread Operator (`[...prev, { ...product, quantity: qtyToAdd }]`)
  7. เรียก `showToast()` เพื่อแจ้งเตือนผู้ใช้มุมขวาล่าง
* **ทำไมต้องเขียนแบบนี้:** ปฏิบัติตามหลัก React Immutability State ไม่แก้ไข State เดิมโดยตรง ป้องกันปัญหา UI ไม่ยอม Re-render

##### 3. ฟังก์ชัน `updateQty(key, delta)`
* **หน้าที่หลัก:** ปรับเพิ่มหรือลดจำนวนสินค้า (+1 หรือ -1) และลบรายการทิ้งอัตโนมัติหากยอดเหลือ 0
* **Input / Output:**
  * *รับเข้า (Param):* `key` (Compound Key ของสินค้า) และ `delta` (ตัวเลข `+1` หรือ `-1`)
  * *ส่งออก (Return):* `void`
* **การทำงานทีละบรรทัด:**
  1. ใช้ `.map()` วนรอบ `prev` เพื่อหาแถวที่ `getCartKey(item) === key`
  2. หากเจอ จะสร้าง Object ใหม่ที่มี `quantity: item.quantity + delta`
  3. ใช้ `.filter(item => item.quantity > 0)` ต่อท้ายทันที เพื่อคัดกรองแถวที่ยอดเหลือ `0` หรือติดลบทิ้งไป
* **ทำไมต้องเขียนแบบนี้:** รวมฟังก์ชันปรับจำนวนและฟังก์ชัน Auto-Remove ไว้ในกระบวนการเดียว (Chaining `.map().filter()`) ทำให้โค้ดสะอาดและไม่มีรายการค้างที่จำนวนเป็น 0 ในตะกร้า

---

### 2.2 `AuthContext.jsx` — ระบบจัดการสถานะผู้ใช้และสิทธิ์ RBAC

#### 💻 โค้ดหลัก (Source Code):
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const local = localStorage.getItem('matcha_user');
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem('matcha_user');
      if (session) return JSON.parse(session);
      return null;
    } catch {
      return null;
    }
  });

  const login = (userData, rememberMe = true) => {
    setCurrentUser(userData);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('matcha_user', JSON.stringify(userData));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('matcha_user');
    sessionStorage.removeItem('matcha_user');
  };

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.email === 'admin@matcha.com';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน:

##### 1. Initial State Loader ใน `useState`
* **หน้าที่หลัก:** ดึงข้อมูล Session เดิมของผู้ใช้ที่เคยล็อกอินไว้ขึ้นมาใช้งานทันทีที่เปิดเว็บ
* **การทำงานทีละบรรทัด:**
  1. ตรวจสอบใน `localStorage` ก่อน (กรณีผู้ใช้เคยติ๊ก Remember Me)
  2. หากไม่พบ ให้ตรวจใน `sessionStorage` (กรณีผู้ใช้ไม่ติ๊ก Remember Me)
  3. หากไม่พบทั้งคู่ ให้ตั้งค่าเริ่มต้นเป็น `null` (สถานะ Guest)
* **ทำไมต้องเขียนแบบนี้:** ป้องกันปัญหา Session หลุดเมื่อผู้ใช้กด Refresh หน้าเว็บ (F5)

##### 2. ฟังก์ชัน `login(userData, rememberMe)`
* **หน้าที่หลัก:** บันทึกข้อมูลโปรไฟล์ผู้ใช้เข้าสู่ Global State และ Storage
* **Input / Output:**
  * *รับเข้า:* `userData` (Object ผู้ใช้: id, name, email, role, tier) และ `rememberMe` (Boolean)
* **การทำงานทีละบรรทัด:**
  1. สั่ง `setCurrentUser(userData)` เพื่อกระจายสถานะล็อกอินให้ทุก Component รับรู้
  2. เลือกประเภท Storage (`rememberMe ? localStorage : sessionStorage`)
  3. บันทึกข้อมูลเป็น JSON String ลงใน Storage ที่เลือก

---

### 2.3 `ToastContext.jsx` — ระบบป๊อปอัปแจ้งเตือนส่วนกลาง

#### 💻 โค้ดหลัก (Source Code):
```javascript
import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up select-none">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#2D231E] text-white shadow-2xl border border-[#3E322C] font-mono text-xs">
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-[#85E369]" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-[#BC5A36]" />}
            {toast.type === 'info' && <Info size={16} className="text-[#D0DEC6]" />}
            <span>{toast.message}</span>
            <button onClick={hideToast} className="ml-2 hover:text-[#BC5A36] cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน `showToast(message, type)`:
* **หน้าที่หลัก:** สร้างและแสดงผลป๊อปอัปแจ้งเตือน พร้อมจับเวลาปิดตัวเองอัตโนมัติ
* **การทำงานทีละบรรทัด:**
  1. สร้าง Object `{ message, type, id: Date.now() }` บันทึกลง State `toast`
  2. สั่งรัน `setTimeout` เป็นเวลา 3,500 มิลลิวินาที (3.5 วินาที)
  3. เมื่อครบเวลา Callback จะเรียก `setToast(null)` เพื่อทำลายป๊อปอัปออกจาก DOM
* **ทำไมต้องเขียนแบบนี้:** เป็นระบบ Non-blocking Notification ที่ไม่รบกวนการทำงานของผู้ใช้ และเรียกใช้ได้จากทุกหน้าผ่าน Custom Hook `useToast()`

---

## 3. Root & Global Routing (`App.jsx` & `Layout.jsx`)

#### 💻 โค้ดหลัก (Source Code ใน `App.jsx`):
```javascript
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import Payment from './pages/Payment';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import UserAccount from './pages/UserAccount';
import AdminPage from './pages/AdminPage';

export default function App() {
  // ติดตั้ง Lenis Smooth Scroll Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/account" element={<UserAccount />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}
```

#### 🔍 เจาะลึกการทำงานของ Lenis Smooth Scroll Setup:
* **หน้าที่หลัก:** จัดการการเลื่อนหน้าจอ (Scrolling Physics) ให้มีความนุ่มนวลระดับ 60fps
* **การทำงานทีละบรรทัด:**
  1. สร้าง Instance `new Lenis({ duration: 1.2, ... })` กำหนดเวลาหน่วงและสูตรคณิตศาสตร์ Easing
  2. ฟังก์ชัน `raf(time)` ส่ง Time Delta ให้ `lenis.raf(time)` และวนลูปอย่างต่อเนื่องด้วย `requestAnimationFrame(raf)`
  3. ในส่วน `return () => lenis.destroy()` จะทำหน้าที่ Cleanup เมื่อ Component ถูก Unmount ป้องกัน Memory Leak

---

## 4. หน้าแคตตาล็อกสินค้า & ตัวกรองแนวนอน

### 4.1 `TopFilterBar.jsx` — แถบตัวกรองแนวนอนระดับพรีเมียม

#### 💻 โค้ดหลักส่วนตัวกรองสี (Color Popover):
```javascript
{/* Color Dropdown Pill */}
<div className="relative">
  <button
    onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
    className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
      selectedColor !== 'ALL' ? 'bg-[#2D5A27] text-white border-[#2D5A27]' : 'bg-white border-[#D9D3C7] text-[#2D231E]'
    }`}
  >
    <span>Color: {selectedColor}</span>
    <ChevronDown size={13} />
  </button>

  {/* Color Popover (3 Columns - มองเห็นครบ 13 สี ไม่ต้องเลื่อนจอ) */}
  {openDropdown === 'color' && (
    <>
      {/* Backdrop ปิดเมนูเมื่อคลิกข้างนอก */}
      <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenDropdown(null)} />
      
      <div 
        onWheel={(e) => e.stopPropagation()} 
        className="absolute left-0 mt-2 w-80 sm:w-115 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-3.5 z-30 font-mono text-xs animate-fade-in"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {colorOptions.map((c) => (
            <button
              key={c.name}
              onClick={() => { onSelectColor(c.name); setOpenDropdown(null); }}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )}
</div>
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน & Event Handling:
* **Backdrop Dismissal:** ใช้ `<div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />` วางเป็นเลเยอร์โปร่งแสงเต็มจอ เมื่อผู้ใช้คลิกพื้นที่ว่างข้างนอก ป๊อปอัปจะปิดตัวลงทันทีอย่างเป็นธรรมชาติ
* **`onWheel={(e) => e.stopPropagation()}`:**
  * *หน้าที่:* หยุดการส่งต่อ Event กลิ้งเมาส์ (Event Bubbling)
  * *ผลลัพธ์:* ป้องกันปัญหาที่เมื่อผู้ใช้เลื่อนลูกกลิ้งเมาส์เหนือกล่อง Popover แล้วทำให้หน้าเว็บด้านหลังเลื่อนกระตุกตาม

---

## 5. คอมโพเนนต์การ์ดสินค้า & หน้าต่างพรีวิว

### 5.1 `ProductCard.jsx`

#### 💻 โค้ดหลัก (Source Code):
```javascript
export default function ProductCard({ product, onQuickView, onToggleWishlist, isWishlisted = false }) {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const variants = product?.variants || [{ color: product.color, colorHex: product.colorHex, image: product.image }];
  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [isHovered, setIsHovered] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);

  // ฟังก์ชันตรวจสิทธิ์ก่อนกดหัวใจ
  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพื่อบันทึกรายการสินค้าที่ชอบ (Wishlist)', 'info');
      return;
    }
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-[#D9D3C7] hover:border-[#2D5A27] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col justify-between select-none"
    >
      {/* Photo Container: aspect-4/5 + object-contain ป้องกันภาพล้น */}
      <div 
        onClick={() => onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image })}
        className="relative aspect-4/5 w-full bg-[#FAF8F5] overflow-hidden cursor-pointer flex items-center justify-center p-3.5"
      >
        <img
          src={activeVariant.image}
          alt={product.name}
          className="w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-102"
        />

        {/* Wishlist Button (ตรวจสอบสิทธิ์) */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
            wishlistActive ? 'bg-white text-rose-600 ring-2 ring-rose-300' : 'bg-white/85 text-[#6B5E55] hover:text-rose-600'
          }`}
        >
          <Heart size={15} className={wishlistActive ? 'fill-rose-500 text-rose-500' : ''} />
        </button>

        {/* Centered Quick View Overlay with Dark Dimming */}
        <div className={`absolute inset-0 z-20 bg-black/35 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image });
            }}
            className="px-5 py-2.5 bg-white/95 hover:bg-white text-[#2D231E] hover:text-[#2D5A27] text-xs font-mono font-bold uppercase rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Eye size={14} />
            <span>Quick View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน:
##### `handleWishlistClick(e)`
* **หน้าที่หลัก:** ตรวจสอบการยืนยันตัวตนของผู้ใช้ และบันทึกสินค้าลง Wishlist
* **การทำงานทีละบรรทัด:**
  1. `e.stopPropagation()`: สกัดกั้นไม่ให้ Event การคลิกหัวใจ ทะลุไปทริกเกอร์การเปิด Modal พรีวิวของตัวการ์ดหลัก
  2. `if (!currentUser)`: ตรวจสอบสถานะล็อกอิน หากเป็น `null` (Guest) จะเรียก `showToast()` แจ้งเตือน และ `return` ตัดการทำงานทันที
  3. หากล็อกอินแล้ว จะสั่งสลับ State `setWishlistActive(!wishlistActive)` และส่งข้อมูลต่อไปยัง Parent Callback `onToggleWishlist`

---

## 6. หน้าตะกร้าสินค้า & ตัววัดยอดส่งฟรี

### 6.1 `CartPage.jsx`

#### 💻 โค้ดคำนวณและ Progress Bar:
```javascript
const { cartItems, updateQty, removeItem, subtotal, shipping, total, awayFromFreeShipping, getCartKey } = useCart();

// คำนวณเปอร์เซ็นต์ยอดส่งฟรี (เต็ม 100%)
const freeShippingPercent = Math.min(100, Math.round((subtotal / 100) * 100));

return (
  <div className="max-w-7xl mx-auto p-6">
    {/* Free Shipping Progress Indicator */}
    <div className="p-4 rounded-2xl bg-white border border-[#D9D3C7] mb-6 font-mono text-xs">
      <div className="flex justify-between mb-2">
        <span>{awayFromFreeShipping === 0 ? '🎉 You unlocked FREE Express Shipping!' : `Add $${awayFromFreeShipping.toFixed(2)} more for Free Shipping`}</span>
        <span className="font-bold text-[#2D5A27]">{freeShippingPercent}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden">
        <div style={{ width: `${freeShippingPercent}%` }} className="h-full bg-[#2D5A27] transition-all duration-500" />
      </div>
    </div>
  </div>
);
```

---

## 7. ระบบชำระเงิน & คำนวณส่วนลด (`Payment.jsx`)

#### 💻 โค้ดเครื่องยนต์คูปองส่วนลด (Coupon Engine):
```javascript
const [couponCode, setCouponCode] = useState('');
const [discountAmount, setDiscountAmount] = useState(0);

const handleApplyCoupon = () => {
  const code = couponCode.trim().toUpperCase();
  if (code === 'MATCHA15') {
    const discount = subtotal * 0.15;
    setDiscountAmount(discount);
    showToast('Applied 15% OFF Discount Coupon!', 'success');
  } else if (code === 'FREESHIP') {
    setDiscountAmount(shipping);
    showToast('Applied Free Shipping Coupon!', 'success');
  } else {
    showToast('Invalid or expired coupon code', 'error');
  }
};

const finalTotal = Math.max(0, subtotal - discountAmount + shipping);
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน `handleApplyCoupon()`:
* **หน้าที่หลัก:** ตรวจสอบความถูกต้องของรหัสคูปอง และคำนวณมูลค่าส่วนลดที่จะนำไปหักลบจากยอดรวม
* **การทำงานทีละบรรทัด:**
  1. `couponCode.trim().toUpperCase()`: ตัดช่องว่างหัวท้ายและแปลงเป็นตัวพิมพ์ใหญ่ เพื่อให้รับโค้ดได้ไม่ว่าผู้ใช้จะพิมพ์ `matcha15` หรือ `MATCHA15`
  2. เงื่อนไข `MATCHA15`: คำนวณลด 15% จาก `subtotal`
  3. เงื่อนไข `FREESHIP`: ตั้งค่าลดหย่อนเท่ากับค่าจัดส่ง `shipping`
  4. คำนวณ `finalTotal` ด้วย `Math.max(0, ...)` เพื่อป้องกันยอดเงินติดลบในกรณีที่มูลค่าส่วนลดมากกว่าราคาสินค้า

---

## 8. ระบบสมาชิก & โปรไฟล์ผู้ใช้ (`LoginPage.jsx` & `UserAccount.jsx`)

#### 💻 โค้ด Demo Authentication Buttons:
```javascript
const handleQuickDemoLogin = (role) => {
  if (role === 'admin') {
    login({ id: 'ADM-001', name: 'Master Administrator', email: 'admin@matcha.com', role: 'Admin', tier: 'Executive' });
    navigate('/admin');
  } else {
    login({ id: 'MEM-001', name: 'Nattapong Somchai', email: 'member@matcha.vip', role: 'Member', tier: 'VIP Connoisseur' });
    navigate('/account');
  }
  showToast(`Logged in as Demo ${role.toUpperCase()}`, 'success');
};
```

---

## 9. หน้าผู้ดูแลระบบระดับสูง (`AdminPage.jsx` — Executive Command Dashboard)

#### 💻 โค้ดการส่งออกข้อมูล CSV (พร้อม UTF-8 BOM สำหรับ Microsoft Excel):
```javascript
// ฟังก์ชันช่วยดาวน์โหลดไฟล์พร้อม UTF-8 BOM ป้องกันภาษาไทยเพี้ยนใน Excel
const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
  const bom = type.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${filename} successfully!`, 'success');
};

const handleExportInventory = () => {
  const headers = ['SKU ID,Product Name,Category,Price ($),Stock,Status,Color,Fit,Season,Created Date'];
  const rows = inventory.map(item =>
    `"${item.id}","${item.name.replace(/"/g, '""')}","${item.category}",${item.price},${item.stock},"${item.status}","${item.color}","${item.fit}","${item.season}","${item.createdAt}"`
  );
  downloadFile([headers, ...rows].join('\n'), `MatchA_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
};
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน `downloadFile`:
* **หน้าที่หลัก:** สร้างและดาวน์โหลดไฟล์จากหน้าเว็บโดยตรง (Client-Side File Generation)
* **การทำงานทีละบรรทัด:**
  1. `const bom = type.includes('csv') ? '\uFEFF' : ''`: ใส่รหัส **Byte Order Mark** ป้องกันโปรแกรม Excel แสดงผลภาษาไทยเป็นภาษาต่างดาว
  2. `new Blob([bom + content], { type })`: นำเนื้อหามาแปลงเป็น Binary Large Object
  3. `URL.createObjectURL(blob)`: สร้าง Virtual Memory URL ชั่วคราว
  4. สร้าง Element `<a>` จำลองการคลิกดาวน์โหลดอัตโนมัติ และลบ Element ทิ้ง
  5. `URL.revokeObjectURL(url)`: เคลียร์หน่วยความจำ RAM เพื่อป้องกัน Memory Leak

---

## 10. Service Layer & API Resilience (`api.js` & `productsData.js`)

#### 💻 โค้ดฟังก์ชันสลับโหมดอัตโนมัติ (Fallback Pipeline):
```javascript
import { productsData } from '../data/productsData';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchWithFallback = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[MatchA API Fallback] Express server offline at ${endpoint}. Serving Local Dataset.`);
    
    // หากเป็น Endpoint สินค้า จะส่ง Local productsData 60 ชิ้นกลับไปแทนทันที
    if (endpoint.includes('/products')) {
      return { success: true, data: productsData, isFallback: true };
    }
    return { success: false, error: error.message, isFallback: true };
  }
};
```

#### 🔍 เจาะลึกการทำงานของฟังก์ชัน `fetchWithFallback`:
* **หน้าที่หลัก:** จัดการการสื่อสารกับ Backend พร้อมระบบรองรับข้อผิดพลาด (Fault Tolerance)
* **การทำงานทีละบรรทัด:**
  1. ในบล็อก `try`: ส่ง HTTP Request ไปยังเซิร์ฟเวอร์ Express API จริง (`:5000`)
  2. หากสถานะไม่ใช่ 200 OK (`!response.ok`) จะโยน Error ไปที่บล็อก `catch`
  3. ในบล็อก `catch`: ตรวจสอบว่าหากเป็นการเรียกข้อมูลสินค้า จะดึงจาก `productsData.js` ในเครื่อง (60 รายการ) มาส่งกลับไปแทนทันที
* **ผลลัพธ์ทางวิศวกรรม:** เว็บไซต์สามารถทำงานได้อย่างราบรื่น 100% โดยไม่มีหน้าจอขาว แม้เซิร์ฟเวอร์ Node.js จะปิดอยู่ก็ตาม

---

## 🎯 สรุปภาพรวม Data Pipeline ทั้งระบบ:
$$\text{User Action (UI)} \longrightarrow \text{Handler (Validation / Auth Check)} \longrightarrow \text{Context State Mutation} \longrightarrow \text{LocalStorage Sync} \longrightarrow \text{Toast Notification}$$
