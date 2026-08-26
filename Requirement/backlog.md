# MatchA Product Backlog & Agile Sprint Specification (backlog.md)

> **เอกสารรายการสิ่งที่ต้องส่งมอบของผลิตภัณฑ์และแผนการพัฒนาสปรินต์ (Product Backlog & Sprint Roadmap)**  
> **โปรเจกต์:** MatchA — Personal Color Fashion & Accessories E-Commerce Platform  
> **แนวทางการพัฒนา:** Agile / Scrum Framework  
> **เวอร์ชัน:** 1.0.0 (Comprehensive Release)

---

## สารบัญ (Table of Contents)
1. [ภาพรวมของกระบวนการ Agile (Agile Framework & Governance)](#1-ภาพรวมของกระบวนการ-agile)
2. [ตารางสรุปสถานะ Epics & Story Points ทั้งหมด](#2-ตารางสรุปสถานะ-epics--story-points-ทั้งหมด)
3. [รายละเอียด User Stories แยกตามแต่ละ Epic](#3-รายละเอียด-user-stories-แยกตามแต่ละ-epic)
   * [EPIC-01: Product Discovery & Lookbook Experience (หน้าแรก & นิตยสาร)](#epic-01-product-discovery--lookbook-experience)
   * [EPIC-02: Catalog & Personal Color Multi-Facet Filtering (แคตตาล็อกสินค้า)](#epic-02-catalog--personal-color-multi-facet-filtering)
   * [EPIC-03: Interactive Customizer & Shopping Cart Engine (ตะกร้าสินค้า)](#epic-03-interactive-customizer--shopping-cart-engine)
   * [EPIC-04: Multi-Step Checkout & Order Receipt (ระบบชำระเงิน)](#epic-04-multi-step-checkout--order-receipt)
   * [EPIC-05: Authentication & Member Lounge (ระบบสมาชิก)](#epic-05-authentication--member-lounge)
   * [EPIC-06: Admin Dashboard & Inventory Management (แดชบอร์ดแอดมิน)](#epic-06-admin-dashboard--inventory-management)
   * [EPIC-07: System Architecture, Resilience & Quality (โครงสร้างระบบ)](#epic-07-system-architecture-resilience--quality)
4. [Sprint Roadmap & Release Milestones](#4-sprint-roadmap--release-milestones)

---

## 1. ภาพรวมของกระบวนการ Agile

### 1.1 เกณฑ์การจัดลำดับความสำคัญ (MoSCoW Priority)
* **Must Have (M):** ฟังก์ชันจำเป็นสูงสุดที่ระบบต้องมีตาม Rubric การประเมิน
* **Should Have (S):** ฟังก์ชันสำคัญที่ช่วยให้ UX และการทำงานสมบูรณ์แบบ
* **Could Have (C):** ฟังก์ชันเสริมที่เพิ่มความพรีเมียม (เช่น Micro-animations, Smooth Scroll)
* **Won't Have (W):** ฟังก์ชันที่ยังไม่ทำใน Sprint ปัจจุบัน (เช่น ระบบตัดเงินบัตรจริงกับธนาคาร)

### 1.2 เกณฑ์ความพร้อมของงาน (Definition of Ready - DoR)
1. User Story เขียนในรูปแบบ *"As a [User], I want [Action], So that [Benefit]"*
2. มีเงื่อนไขการยอมรับ (Acceptance Criteria - AC) ชัดเจนทุกข้อ
3. มีการประเมิน Story Points ตามลำดับ Fibonacci (1, 2, 3, 5, 8, 13)

### 1.3 เกณฑ์ความสำเร็จของงาน (Definition of Done - DoD)
1. โค้ดผ่านการทดสอบ In-RAM Compile (0 errors, 0 warnings)
2. รองรับ Responsive ทุกขนาดหน้าจอ (Mobile, Tablet, Desktop)
3. มีการดักจับข้อผิดพลาด (Image Fallback, Error Boundaries)
4. จัดเก็บสถานะและซิงค์ข้อมูลอย่างถูกต้อง (Context API / LocalStorage)

---

## 2. ตารางสรุปสถานะ Epics & Story Points ทั้งหมด

| รหัส Epic | ชื่อมหากาพย์ (Epic Name) | จำนวน Stories | Story Points รวม | สถานะปัจจุบัน |
| :--- | :--- | :---: | :---: | :---: |
| **EPIC-01** | Product Discovery & Lookbook Experience | 5 | 18 pts | **COMPLETED (100%)** |
| **EPIC-02** | Catalog & Personal Color Filtering | 4 | 21 pts | **COMPLETED (100%)** |
| **EPIC-03** | Interactive Customizer & Cart Engine | 4 | 16 pts | **COMPLETED (100%)** |
| **EPIC-04** | Multi-Step Checkout & Order Receipt | 5 | 20 pts | **COMPLETED (100%)** |
| **EPIC-05** | Authentication & Member Lounge | 4 | 15 pts | **COMPLETED (100%)** |
| **EPIC-06** | Admin Dashboard & Inventory Control | 4 | 18 pts | **COMPLETED (100%)** |
| **EPIC-07** | Architecture, Resilience & Quality | 5 | 17 pts | **COMPLETED (100%)** |
| **รวมทั้งหมด** | **7 Epics** | **31 Stories** | **125 pts** | **READY & VERIFIED** |

---

## 3. รายละเอียด User Stories แยกตามแต่ละ Epic

---

### EPIC-01: Product Discovery & Lookbook Experience
> **เป้าหมาย:** สร้างประสบการณ์สำรวจคอลเลกชันเสื้อผ้าและกระเป๋า Personal Color ที่มีชีวิตชีวา สไตล์สตรีทแวร์ญี่ปุ่น

#### US-01: 4-Slice Interactive Hero Lookbook Cover
* **User Story:** As a Fashion Shopper, I want an interactive 4-slice hero cover lookbook, So that I can explore seasonal personal color drops visually.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงแบนเนอร์แนวตั้ง 4 ชิ้น (Spring, Summer, Autumn, Winter)
  * [x] AC-02: ตรวจจับพิกัดเมาส์ (Mouse Tracking) เพื่อขยายชิ้นที่เมาส์ชี้แบบ Dynamic Scale
  * [x] AC-03: มีปุ่ม CTA "Explore Personal Color Drop" นำทางไปหน้า Catalog
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-02: 2K Studio Silhouette & Bags Fit Selector
* **User Story:** As a Buyer, I want to view studio model fits and bag silhouettes, So that I can choose the garment style that fits my body and personal style.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงการ์ดสไตล์ 6 หมวด (Boxy Tee, Linen Trouser, Canvas Tote, Mineral Fleece, Cardigan, Bucket Hat)
  * [x] AC-02: คลิกที่ทรงเสื้อผ้าแล้วเปลี่ยนหมวดหมู่และนำทางเข้าหน้า Catalog โดยอัตโนมัติ
* **Priority:** Should Have | **Story Points:** 3 | **Status:** Done

#### US-03: Featured Street Favorites Carousel & Tone Swatches
* **User Story:** As a Collector, I want to see trending items with live color dot swatches, So that I can preview different personal color shades immediately.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงการ์ดสินค้าพร้อมป้ายแท็ก 3 แบบ (`Best Seller`, `New Season`, `Vault Archive`)
  * [x] AC-02: คลิกเปลี่ยนจุดสีแล้วรูปภาพสินค้าสลับตามเฉดสีที่เลือกอย่างนุ่มนวล
  * [x] AC-03: มีปุ่ม Quick Add และ Quick View
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-04: Cinematic Video Promo & Discount Claim
* **User Story:** As a Visitor, I want to watch the brand's video and claim a discount code, So that I get a 15% discount for my first purchase.
* **Acceptance Criteria:**
  * [x] AC-01: เล่นวิดีโอสตูดิโอแบบ Smooth Loop พร้อมปุ่ม Claim Code
  * [x] AC-02: เมื่อกดปุ่ม แสดง Toast แจ้งเตือนโค้ด `MATCHA15` ทันที
* **Priority:** Should Have | **Story Points:** 2 | **Status:** Done

#### US-05: VIP Drop List Subscription Form
* **User Story:** As a Member, I want to subscribe with my email, So that I receive notifications 30 minutes before limited color drops go live.
* **Acceptance Criteria:**
  * [x] AC-01: ช่องกรอกอีเมลพร้อมการตรวจสอบรูปแบบ (Email Validation)
  * [x] AC-02: แสดงการแจ้งเตือนตอบรับผ่าน Toast เมื่อส่งข้อมูลสำเร็จ
* **Priority:** Could Have | **Story Points:** 3 | **Status:** Done

---

### EPIC-02: Catalog & Personal Color Multi-Facet Filtering
> **เป้าหมาย:** สร้างระบบค้นหาและคัดกรองสินค้าตาม Personal Color Season, เฉดสี, หมวดหมู่ และราคาอย่างแม่นยำ

#### US-06: Multi-Facet Slide-out Filter Drawer
* **User Story:** As a Customer, I want a slide-out drawer with multi-criteria filters, So that I can narrow down garments and bags by my personal color tone.
* **Acceptance Criteria:**
  * [x] AC-01: ตัวกรองตาม 5 ฤดูกาล (Spring, Summer, Autumn, Winter, Artisan Core)
  * [x] AC-02: จานสี Color Palette 13 เฉดสีพร้อมตัวอย่างสี Hex
  * [x] AC-03: ตัวกรองทรงเสื้อผ้า (Silhouette Fits) และสไลเดอร์ราคา ($30 – $200)
  * [x] AC-04: สวิตช์เปิด-ปิดกรองเฉพาะสินค้าพร้อมส่ง (In-Stock Only)
  * [x] AC-05: ปุ่ม Reset Filters เพื่อล้างการค้นหาทั้งหมดในคลิกเดียว
* **Priority:** Must Have | **Story Points:** 8 | **Status:** Done

#### US-07: Toolbar with Search & Category Pills
* **User Story:** As a Shopper, I want a top toolbar with a search bar and category pills, So that I can quickly jump between Tops, Bags, Bottoms, and Outerwear.
* **Acceptance Criteria:**
  * [x] AC-01: ช่องค้นหาคีย์เวิร์ด (Search Query) ค้นหาจากชื่อสินค้าและเนื้อผ้า
  * [x] AC-02: เม็ด Category Pills แสดงจำนวนสินค้าคงเหลือในหมวดนั้นๆ
  * [x] AC-03: Dropdown เรียงลำดับ (Sort by: Featured, Price Low-High, Price High-Low, Rating)
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-08: Multi-Column Grid & List Layout Switcher
* **User Story:** As a User, I want to switch grid layouts (2, 3, 4 columns, or List view), So that I can browse in the density that suits my screen size.
* **Acceptance Criteria:**
  * [x] AC-01: ปุ่มกดสลับมุมมอง 2-Col, 3-Col, 4-Col และ 1-Col List View
  * [x] AC-02: ปรับเปลี่ยน Layout แบบเรียลไทม์โดยไม่ต้องรีเฟรชหน้า
* **Priority:** Should Have | **Story Points:** 3 | **Status:** Done

#### US-09: 4-State UI Standards (Skeleton, Empty, Data, Pagination)
* **User Story:** As a User, I want to see loading skeletons and helpful empty states, So that I understand system status at all times.
* **Acceptance Criteria:**
  * [x] AC-01: ระหว่างโหลดข้อมูล แสดง `ProductCardSkeleton` ตรงรูปทรงการ์ดจริง
  * [x] AC-02: หากไม่พบสินค้า แสดง `EmptyState` พร้อมปุ่ม *"Reset All Filters"*
  * [x] AC-03: ระบบแบ่งหน้า (`CatalogPagination`) 12 รายการต่อหน้า พร้อมตัวเลขและปุ่ม Prev/Next
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

---

### EPIC-03: Interactive Customizer & Shopping Cart Engine
> **เป้าหมาย:** สร้างระบบปรับแต่งสี/ไซส์แบบ Modal และระบบตะกร้าสินค้าที่คำนวณราคาอัตโนมัติ

#### US-10: Product Customizer & Quick View Modal
* **User Story:** As a Shopper, I want a quick view modal with variant customizer, So that I can inspect product details and select color/size without leaving the catalog.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงรูปภาพขนาดใหญ่ ขยายและสลับภาพตามเฉดสีที่เลือก
  * [x] AC-02: ปุ่มเลือกไซส์ (S, M, L, XL, OS) และ Stepper ปรับจำนวนชิ้น
  * [x] AC-03: ดักจับปุ่ม **`Escape` (ESC)** เพื่อปิด Modal และล็อก Scroll พื้นหลัง (`overflow: hidden`)
  * [x] AC-04: ดักจับรูปภาพโหลดไม่ติดด้วย `handleImageError` fallback
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-11: Centralized Cart Store (`CartContext`)
* **User Story:** As a Developer, I want a global React Context for the shopping cart, So that any component can read cart count and dispatch actions without prop drilling.
* **Acceptance Criteria:**
  * [x] AC-01: Custom Hook `useCart()` ให้บริการ `cartItems`, `addToCart`, `updateQty`, `removeItem`, `clearCart`
  * [x] AC-02: คำนวณอัตโนมัติ: `cartCount`, `subtotal`, `shipping`, `total`, `awayFromFreeShipping`
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-12: Composite Key Cart Mutations
* **User Story:** As a Customer, I want to add multiple colors/sizes of the same garment into my cart, So that each variant is treated as a distinct item.
* **Acceptance Criteria:**
  * [x] AC-01: สร้าง Unique Key ด้วยสูตร `${product.id}-${size}-${color}`
  * [x] AC-02: หากเพิ่มสินค้าที่สีและไซส์ตรงกัน ให้บวกจำนวนเพิ่มแทนการสร้างแถวใหม่
* **Priority:** Must Have | **Story Points:** 3 | **Status:** Done

#### US-13: Free Shipping Progress Bar ($100 Threshold)
* **User Story:** As a Buyer, I want to see a visual progress bar towards free shipping, So that I know how much more to spend to waive shipping fees.
* **Acceptance Criteria:**
  * [x] AC-01: แถบ Progress Bar คำนวณจากยอด `$100.00`
  * [x] AC-02: แสดงข้อความแจ้งยอดคงเหลือ (เช่น *"You are $12.00 away from FREE Shipping!"*)
  * [x] AC-03: ซิงค์ข้อมูลตะกร้าลง `localStorage ('matcha_cart')` ทุกครั้งที่มีการเปลี่ยนแปลง
* **Priority:** Should Have | **Story Points:** 3 | **Status:** Done

---

### EPIC-04: Multi-Step Checkout & Order Receipt
> **เป้าหมาย:** สร้างกระบวนการเช็คเอาต์ที่ง่าย ชัดเจน พร้อมระบบตรวจสอบความถูกต้องและออกใบเสร็จ

#### US-14: Step 1 - Shipping & Address Form Validation
* **User Story:** As a Customer, I want to enter my delivery address with form validation, So that my order is delivered to the correct location.
* **Acceptance Criteria:**
  * [x] AC-01: ฟิลด์กรอกข้อมูลครบถ้วน: First Name, Last Name, Email, Phone, Address, City, Zip Code
  * [x] AC-02: ปุ่ม "Proceed to Payment" จะถูกปิดการใช้งาน (Disabled) จนกว่าจะกรอกข้อมูลครบ
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-15: Step 2 - Delivery Method Selection
* **User Story:** As a Buyer, I want to choose my preferred delivery speed, So that I can balance between shipping cost and urgency.
* **Acceptance Criteria:**
  * [x] AC-01: 3 ตัวเลือกการจัดส่ง: Standard ($0 หรือ $10), Priority Express ($12), VIP Same-Day ($25)
  * [x] AC-02: ค่าจัดส่งคำนวณเข้ายอดรวม Total แบบ Real-time ทันที
* **Priority:** Should Have | **Story Points:** 3 | **Status:** Done

#### US-16: Step 3 - Payment Method Selection
* **User Story:** As a Customer, I want multiple payment options, So that I can pay using my preferred method.
* **Acceptance Criteria:**
  * [x] AC-01: รองรับ 4 วิธีการ: บัตร Visa, Mastercard, สแกน PromptPay QR Code, และ Cash on Delivery (COD)
  * [x] AC-02: ฟอร์มกรอกเลขบัตรเครดิต 16 หลัก, ชื่อผู้ถือบัตร, วันหมดอายุ (MM/YY), และ CVV
  * [x] AC-03: แสดงป้ายรับรองความปลอดภัย 256-Bit SSL Encrypted
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-17: Order Summary Breakdown & Coupon Engine
* **User Story:** As a Shopper, I want to apply discount coupons and see the cost breakdown, So that I can verify my discounts before ordering.
* **Acceptance Criteria:**
  * [x] AC-01: รองรับรหัสคูปอง: `MATCHA15` (15%), `FREESHIP` (ฟรีค่าส่ง), `01` (10%), `02` (20%), `03` (50%)
  * [x] AC-02: คำนวณ Subtotal, Shipping, Discount, และ Final Total อย่างแม่นยำ
  * [x] AC-03: มีปุ่ม Remove Coupon เพื่อยกเลิกโค้ดส่วนลด
* **Priority:** Must Have | **Story Points:** 4 | **Status:** Done

#### US-18: Order Confirmation Receipt Modal (with Purchase Date/Time)
* **User Story:** As a Customer, I want an official order receipt modal with purchase timestamp, So that I have proof of my order for tracking.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงป๊อปอัปใบเสร็จพร้อม Order ID สุ่ม (เช่น `#MTA-2026-8942`)
  * [x] AC-02: **แสดงฟิลด์บังคับ Purchase Date/Time** (เช่น `26 Aug 2026, 13:00 GMT+7`)
  * [x] AC-03: เคลียร์ตะกร้าสินค้าอัตโนมัติ (`clearCart()`) และมีปุ่ม "Continue Shopping"
* **Priority:** Must Have | **Story Points:** 3 | **Status:** Done

---

### EPIC-05: Authentication & Member Lounge
> **เป้าหมาย:** สร้างระบบล็อกอิน บัญชีทดสอบ สมัครสมาชิก และหน้าจัดการโปรไฟล์ส่วนตัว

#### US-19: One-Click Demo Accounts Login
* **User Story:** As an Evaluator/User, I want quick demo login buttons, So that I can test Member and Admin roles in 1 click without typing.
* **Acceptance Criteria:**
  * [x] AC-01: ปุ่มกดล็อกอิน Admin (`admin@matcha.vip` / `admin1234`)
  * [x] AC-02: ปุ่มกดล็อกอิน VIP Member (`member@matcha.vip` / `user1234`)
  * [x] AC-03: สลับบทบาทและแสดงป้าย Badge 👑 ADMIN หรือ 🟢 VIP MEMBER อัตโนมัติ
* **Priority:** Must Have | **Story Points:** 3 | **Status:** Done

#### US-20: VIP Member Registration Form
* **User Story:** As a New User, I want to sign up with my full details, So that I can create a personal MatchA VIP account.
* **Acceptance Criteria:**
  * [x] AC-01: ฟิลด์กรอกข้อมูลบังคับ: **First Name, Last Name, Email, Password, Password Confirmation**
  * [x] AC-02: ระบบตรวจสอบรหัสผ่านขั้นต่ำ 6 ตัวอักษร และตรวจสอบรหัสผ่านตรงกัน
  * [x] AC-03: เมื่อสมัครสำเร็จ ให้ล็อกอินและแจ้งเตือนผ่าน Toast ทันที
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-21: Forgot Password Modal
* **User Story:** As a User who forgot my password, I want a reset modal, So that I can request a password recovery link.
* **Acceptance Criteria:**
  * [x] AC-01: ช่องกรอกอีเมลที่ลงทะเบียนไว้
  * [x] AC-02: แสดงสถานะการส่งลิงก์รีเซ็ตรหัสผ่านจำลองสำเร็จ
* **Priority:** Should Have | **Story Points:** 2 | **Status:** Done

#### US-22: Member Lounge 6-Tab Profile Dashboard
* **User Story:** As a VIP Member, I want a multi-tab account dashboard, So that I can manage my personal information, order history, and preferences.
* **Acceptance Criteria:**
  * [x] AC-01: *ProfileTab:* แก้ไขชื่อ, นามสกุล, อีเมล, เบอร์โทร
  * [x] AC-02: *OrdersTab:* ดูประวัติคำสั่งซื้อและสถานะจัดส่ง
  * [x] AC-03: *FavoritesTab:* ดูและกดสั่งซื้อสินค้าใน Wishlist
  * [x] AC-04: *AddressesTab:* จัดการสมุดที่อยู่จัดส่ง
  * [x] AC-05: *PaymentMethodsTab:* บัตรเครดิตที่บันทึกไว้
  * [x] AC-06: *PreferencesTab:* สวิตช์เปิด-ปิดการแจ้งเตือน VIP และ SMS
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

---

### EPIC-06: Admin Dashboard & Inventory Control
> **เป้าหมาย:** สร้างระบบแสดงผลสถิติยอดขายด้วยชาร์ต 2 รูปแบบ และตารางจัดการสต็อกสินค้า

#### US-23: Executive Metrics Summary Cards
* **User Story:** As a Store Admin, I want high-level KPI cards, So that I can monitor total revenue, average order value, total stock, and active members.
* **Acceptance Criteria:**
  * [x] AC-01: การ์ด Total Revenue ($249,000 พร้อมอัตราการเติบโต +18.4%)
  * [x] AC-02: การ์ด Average Order Value ($92.40)
  * [x] AC-03: การ์ด Total Stock (1,420 pcs) และ Active VIP Members (842)
* **Priority:** Must Have | **Story Points:** 3 | **Status:** Done

#### US-24: Chart 1 - Monthly Sales Revenue (Bar Chart)
* **User Story:** As a Store Admin, I want a monthly revenue bar chart, So that I can analyze revenue trends from January to June 2026.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงกราฟแท่ง (Bar Chart) สไตล์ CSS/Tailwind สวยงาม
  * [x] AC-02: แสดงตัวเลขยอดขายเมื่อ Hover แต่ละแท่งเดือน
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-25: Chart 2 - Category Distribution (Donut / Progress Chart)
* **User Story:** As a Store Admin, I want a category distribution chart, So that I know which product category generates the highest volume.
* **Acceptance Criteria:**
  * [x] AC-01: แสดงสัดส่วนเปอร์เซ็นต์หมวดหมู่ (Tops 45%, Bags 25%, Outerwear 20%, Bottoms 10%)
  * [x] AC-02: ใช้โทนสีเฉพาะประจำแต่ละหมวดหมู่อย่างชัดเจน
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-26: Admin Inventory Management Table & Quick Restock
* **User Story:** As a Store Admin, I want an inventory table with stock levels and restock actions, So that I can prevent products from running out of stock.
* **Acceptance Criteria:**
  * [x] AC-01: ตารางแสดง SKU ID, Product Name, Category, Price, Stock Level, Status (`In Stock`, `Low Stock`, `Out of Stock`)
  * [x] AC-02: ปุ่มกด **`+10 Restock`** เพิ่มจำนวนสต็อกสินค้าในตารางทันทีพร้อม Toast Feedback
  * [x] AC-03: ปุ่ม Add Garment/Bag Dialog
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

---

### EPIC-07: System Architecture, Resilience & Quality
> **เป้าหมาย:** วางรากฐานสถาปัตยกรรมที่แข็งแกร่ง เลิกส่ง Props ซ้ำซ้อน และมีระบบ Fallback สำรองข้อมูล

#### US-27: React Context API Central Store Migration
* **User Story:** As a Lead Engineer, I want to centralize Cart, Auth, and Toast state in Context Providers, So that we eliminate prop drilling across the entire component tree.
* **Acceptance Criteria:**
  * [x] AC-01: สร้าง `CartContext`, `AuthContext`, `ToastContext`
  * [x] AC-02: ครอบ Root Component ใน `App.jsx` ด้วย Providers ทั้ง 3 ตัว
* **Priority:** Must Have | **Story Points:** 5 | **Status:** Done

#### US-28: Lenis Smooth Scrolling Engine Integration
* **User Story:** As a Visitor, I want smooth 60fps momentum scrolling, So that the website feels luxurious and fluid like a native app.
* **Acceptance Criteria:**
  * [x] AC-01: ติดตั้งและตั้งค่า Lenis Smooth Scroll ใน `App.jsx`
  * [x] AC-02: เลื่อนขึ้นบนสุดอัตโนมัติ (Scroll to top) เมื่อเปลี่ยนหน้า
* **Priority:** Should Have | **Story Points:** 3 | **Status:** Done

#### US-29: Dual-Layer Resilience API Service Layer
* **User Story:** As a Developer, I want an API service layer with local fallback, So that the frontend continues to work seamlessly even if the backend server is offline.
* **Acceptance Criteria:**
  * [x] AC-01: `fetchWithFallback()` ใน `services/api.js` ลองเชื่อมต่อ Express API ก่อน
  * [x] AC-02: หากเชื่อมต่อไม่ได้ ให้สลับไปใช้ Mock Data ใน `productsData.js` อัตโนมัติโดยไม่พัง
* **Priority:** Must Have | **Story Points:** 3 | **Status:** Done

#### US-30: Component Modularization & Deconstruction
* **User Story:** As a Software Engineer, I want giant 800+ line files decomposed into small reusable components, So that the codebase is clean and maintainable.
* **Acceptance Criteria:**
  * [x] AC-01: แยก `CatalogPage.jsx` ออกเป็น `CatalogToolbar`, `CatalogFilterDrawer`, `CatalogPagination`
  * [x] AC-02: แยก `Payment.jsx` ออกเป็น `ShippingStep`, `PaymentMethodStep`, `OrderSummarySidebar`, `OrderSuccessModal`
  * [x] AC-03: แยก `UserAccount.jsx` ออกเป็น Tab Components ย่อย 7 โมดูล
* **Priority:** Must Have | **Story Points:** 4 | **Status:** Done

#### US-31: Security Hardening & .gitignore Configuration
* **User Story:** As a DevOps Engineer, I want strict gitignore rules, So that no secrets, AI caches, or temporary files are accidentally committed.
* **Acceptance Criteria:**
  * [x] AC-01: ละเว้น `.env*`, `graft/`, `.agents/`, `.gemini/`, `.vscode/`, `dist/`, `node_modules/`
  * [x] AC-02: ละเว้นไฟล์ Backup ของ Excalidraw (`*.excalidraw.bak`, `*.tmp`)
* **Priority:** Must Have | **Story Points:** 2 | **Status:** Done

---

## 4. Sprint Roadmap & Release Milestones

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 1: Foundation & Core Design Tokens (COMPLETED)                              │
│ • Setup React 18 + Vite + Tailwind CSS v4 Monorepo                                 │
│ • Establish Earth Tone Design Tokens & Lenis Smooth Scroll                         │
│ • Build Mock Product Dataset (Apparel, Bags & Personal Color Attributes)          │
└────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 2: Discovery & Catalog Experience (COMPLETED)                               │
│ • Build 4-Slice Interactive Hero Lookbook & ChooseYourFit 2K Guide                 │
│ • Implement Modular Catalog with Multi-Facet Filter Drawer & Toolbar Switcher      │
│ • Implement 4-State UI Standards (Loading Skeleton, Empty State, Pagination)       │
└────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 3: Shopping Cart, Multi-Step Checkout & Auth (COMPLETED)                    │
│ • Centralize React Context Stores (CartContext, AuthContext, ToastContext)         │
│ • Build Multi-Step Checkout Stepper (Shipping, Payments, Coupon Engine)            │
│ • Build Order Receipt Confirmation Modal with Mandatory Purchase Date/Time         │
│ • Build Rubric-Compliant Sign Up (First/Last Name) & Login Demo Accounts           │
└────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 4: Dashboards, Wireframes & Full Specifications (COMPLETED)                 │
│ • Build User Account Lounge (6 Tabs) & Admin Dashboard (2 Charts + Inventory)      │
│ • Generate Complete Business Model Canvas (BMC), ERD & MongoDB Schemas             │
│ • Generate High-Res UI Wireframe Blueprint & Excalidraw Visual Diagrams            │
└────────────────────────────────────────────────────────────────────────────────────┘
```
