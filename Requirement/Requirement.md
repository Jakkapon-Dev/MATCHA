# MatchA System Requirement Specification (Requirement.md)

> **เอกสารข้อกำหนดระบบและการออกแบบสถาปัตยกรรมฉบับสมบูรณ์ (Full SRS, BMC, ERD, Use Case & Wireframes)**  
> **โปรเจกต์:** MatchA — Personal Color Fashion & Accessories E-Commerce Platform  
> **คอนเซปต์หลัก:** แพลตฟอร์มอีคอมเมิร์ซจำหน่ายเสื้อผ้า กระเป๋า และสินค้าแฟชั่นที่คัดสรรและจัดหมวดหมู่ตาม **"Personal Color" (Spring Warm, Summer Cool, Autumn Warm, Winter Cool)** เพื่อช่วยให้ผู้ใช้เลือกเสื้อผ้าและกระเป๋าที่ขับผิวและเข้ากับสไตล์ตนเองได้อย่างมั่นใจ

---

## สารบัญ (Table of Contents)
1. [Business Model Canvas (BMC)](#1-business-model-canvas-bmc)
2. [Use Case Diagram & System Scenarios](#2-use-case-diagram--system-scenarios)
3. [Database Design: Entity-Relationship Diagram (ERD) & MongoDB Schema](#3-database-design-erd--mongodb-schema)
4. [Wireframes & UI Architecture Specifications](#4-wireframes--ui-architecture-specifications)
   * 4.1 [Landing Page & Product List Wireframe](#41-landing-page--product-list-wireframe)
   * 4.2 [Product Card & Customizer Modal Wireframe](#42-product-card--customizer-modal-wireframe)
   * 4.3 [Shopping Cart Wireframe](#43-shopping-cart-wireframe)
   * 4.4 [Checkout & Order Confirmation (with Purchase Date/Time)](#44-checkout--order-confirmation-wireframe)
   * 4.5 [Authentication Wireframes (Login, Register, Forgot Password)](#45-authentication-wireframes)
   * 4.6 [User & Admin Dashboards (2 Visualization Charts & Inventory)](#46-user--admin-dashboards-wireframe)
5. [ข้อกำหนดเชิงฟังก์ชันตาม Rubric (Functional Requirements Checklist)](#5-ข้อกำหนดเชิงฟังก์ชันตาม-rubric)
6. [Design Tokens & Personal Color Palette](#6-design-tokens--personal-color-palette)

---

## 1. Business Model Canvas (BMC)

![MatchA Business Model Canvas Infographic (ภาษาไทย)](./MatchA_Business_Model_Canvas_TH.jpg)

| **Key Partners (พันธมิตรหลัก)** | **Key Activities (กิจกรรมหลัก)** | **Value Propositions (คุณค่าที่ส่งมอบ)** | **Customer Relationships (ความสัมพันธ์กับลูกค้า)** | **Customer Segments (กลุ่มลูกค้าเป้าหมาย)** |
| :--- | :--- | :--- | :--- | :--- |
| • **Fashion Brands & Suppliers:** แบรนด์แฟชั่นและซัพพลายเออร์คัดสรรเสื้อผ้า กระเป๋า และแอกเซสซอรีส์คุณภาพสูง<br>• **Personal Color Stylists / Color Analysts:** ที่ปรึกษาและสไตลิสต์ผู้เชี่ยวชาญด้านการจำแนกโทนสีผิวและจับคู่สีเสื้อผ้า<br>• **Fashion Influencers:** บล็อกเกอร์และคอนเทนต์ครีเอเตอร์สาย Personal Color / OOTD<br>• **Logistics & Payment Gateways:** ผู้ให้บริการขนส่งและช่องทางชำระเงินออนไลน์ (PromptPay, Visa/Mastercard) | • คัดสรรและจัดกลุ่มเสื้อผ้า กระเป๋า ตามโทนสี **Personal Color (Warm Tone vs Cool Tone / 4 Seasons)**<br>• พัฒนาและดูแลระบบ Lookbook & E-Commerce Web Application (Vite + React + Express)<br>• จัดทำคอนเทนต์ไกด์แนะนำการแมตช์ชุดและกระเป๋าตามโทนสีผิว<br>• บริหารสต็อกสินค้าและระบบคำสั่งซื้อ | • **Shop by Personal Color:** เลือกซื้อเสื้อผ้าและกระเป๋าที่การันตีว่า "ขับผิวและเข้ากับโทนสีประจำตัว" ของตนเองได้อย่างแม่นยำ<br>• **Curated Apparel & Bags:** สินค้าแฟชั่น เสื้อยืด Boxy, สเวตเตอร์, กางเกง, กระเป๋าสะพาย และหมวกที่คุมโทนสไตล์ MatchA Aesthetic<br>• **Interactive Color Lookbook:** เลือกลองดูคู่สี สลับ Color Swatches แบบเรียลไทม์ และระบบค้นหาตาม Personal Color Shade | • MatchA VIP Member Lounge และสะสมสิทธิ์สมาชิกพิเศษ<br>• แจ้งเตือนคอลเลกชันใหม่ตามโทนสีที่ผู้ใช้สนใจ (Personalized Drop Alert)<br>• คู่มือ Fit & Color Guide แนะนำการแต่งตัวบนหน้าเว็บ | • **Personal Color Enthusiasts:** ผู้ที่สนใจและต้องการแต่งตัวตามทฤษฎีสีผิว (Spring, Summer, Autumn, Winter)<br>• **Fashion & Streetwear Shoppers:** กลุ่มคนที่ชอบเสื้อผ้าคุมโทน กระเป๋า และแอกเซสซอรีส์สไตล์มินิมอล/เอิร์ธโทน<br>• **Online Shoppers (Gen Z & Millennials):** ผู้ที่ต้องการความสะดวกในการเลือกไซส์และคู่สีโดยไม่ต้องกังวลเรื่องสีดร็อป |
| **Key Resources (ทรัพยากรหลัก)** | **Channels (ช่องทางการเข้าถึง)** | | | |
| • คลังสินค้าเสื้อผ้า กระเป๋า และแอกเซสซอรีส์ที่แมป Color Palette แล้ว<br>• ระบบแพลตฟอร์ม Web Application (React 18 + Context API + Express)<br>• ฐานข้อมูลสินค้าและรูปภาพ Lookbook ความละเอียดสูง | • เว็บไซต์ MatchA Online Store (`https://matcha.vip`)<br>• โซเชียลมีเดีย (Instagram, TikTok, Lemon8, Pinterest Lookbooks)<br>• ช่องทาง Email & SMS ข่าวสารคอลเลกชันสีใหม่ | | | |
| **Cost Structure (โครงสร้างต้นทุน)** | | **Revenue Streams (กระแสรายได้)** | | |
| • ต้นทุนการจัดซื้อสินค้าเสื้อผ้า กระเป๋า และแพ็กเกจจิ้งจากแบรนด์พาร์ทเนอร์<br>• ค่าบริการ Cloud Server, Web Hosting, และระบบโดเมน<br>• ค่าการตลาด การจัดทำสื่อภาพ Lookbook และความร่วมมือกับ Influencer | | • รายได้หลักจากการจำหน่ายเสื้อผ้า กระเป๋า และแอกเซสซอรีส์แฟชั่น<br>• ค่าบริการจัดส่งด่วนพิเศษ (Express / Priority Shipping)<br>• สินค้า Limited Drop & VIP Exclusive Colorways | | |

---

## 2. Use Case Diagram & System Scenarios

```mermaid
graph LR
    subgraph Users [Actor Layer]
        Guest[👤 Guest User]
        Member[🟢 Registered Member]
        Admin[👑 Store Admin]
    end

    subgraph CoreUseCases [MatchA E-Commerce & Personal Color Use Cases]
        UC1[UC-01: Browse Lookbook by Personal Color Tone]
        UC2[UC-02: Search, Filter Apparel/Bags by Color & Season]
        UC3[UC-03: Manage Cart & Apply Discount Coupons]
        UC4[UC-04: Multi-Step Checkout & Order Confirmation]
        UC5[UC-05: Member Registration, Login & Forgot Password]
        UC6[UC-06: View Member Dashboard, History & Saved Favorites]
        UC7[UC-07: View Admin Analytics Dashboard - 2 Charts]
        UC8[UC-08: Manage Admin Inventory & Bag/Apparel Stock]
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5

    Member --> UC1
    Member --> UC2
    Member --> UC3
    Member --> UC4
    Member --> UC6

    Admin --> UC1
    Admin --> UC7
    Admin --> UC8
```

### รายละเอียด Use Cases หลัก:
* **UC-01 (Personal Color Lookbook):** สำรวจ Lookbook แฟชั่น 4-Slice Cover, เลือกดู Silhouette ทรงเสื้อผ้าและกระเป๋าใน `ChooseYourFit`
* **UC-02 (Color Shade & Category Filtering):** กรองสินค้าตาม Personal Color Season (Spring Warm, Summer Cool, Autumn Warm, Winter Cool), โทนสี 13 เฉด, หมวดหมู่ (Tops, Bottoms, Outerwear, Bags & Accessories), ช่วงราคา และ In-Stock
* **UC-03 (Shopping Cart):** เลือกสี/ไซส์ของเสื้อผ้าและกระเป๋า เพิ่มเข้าตะกร้า คำนวณยอดเงินและสิทธิ์ส่งฟรี ($100 Threshold)
* **UC-04 (Checkout & Confirmation):** กรอกที่อยู่จัดส่ง, เลือกวิธีการชำระเงิน, และรับใบเสร็จที่มี **Purchase Date/Time** และ **Order ID**
* **UC-05 (Auth & Security):** สมัครสมาชิกด้วย First Name, Last Name, Email, Password, Password Confirmation และฟังก์ชัน Forgot Password
* **UC-06 (User Dashboard):** จัดการโปรไฟล์, ดูสถานะคำสั่งซื้อ, สินค้าและกระเป๋าที่บันทึกไว้ใน Wishlist
* **UC-07 & UC-08 (Admin Dashboard & Inventory):** ดูสถิติยอดขายด้วย **Bar Chart**, สัดส่วนหมวดหมู่ด้วย **Donut Chart**, และตารางควบคุมสต็อกเสื้อผ้า/กระเป๋า

---

## 3. Database Design: ERD & MongoDB Schema

### 3.1 Entity-Relationship Diagram (ERD)

![MatchA Database ERD Diagram](./MatchA_Database_ERD.jpg)

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ WISHLIST : saves
    USER ||--o{ ADDRESS : owns
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--|{ ORDER_ITEM : ordered_as
    PRODUCT ||--|{ VARIANT : has
    PRODUCT ||--o{ WISHLIST : added_to
    ORDER }|--|| COUPON : applies

    USER {
        string id PK
        string firstName
        string lastName
        string email UK
        string passwordHash
        string role "Member | Admin"
        string personalColorType "Spring Warm | Summer Cool | Autumn Warm | Winter Cool"
        string phone
        datetime createdAt
    }

    PRODUCT {
        string id PK
        string name
        string description
        string category "Tops | Bottoms | Outerwear | Bags | Accessories"
        float price
        string personalColorSeason "Spring Warm | Summer Cool | Autumn Warm | Winter Cool | All Tones"
        string tag "Best Seller | New Season | Vault Archive"
        string fit "Oversized | Relaxed | Tailored | Boxy | One Size"
        boolean inStock
        int totalStock
        datetime createdAt
    }

    VARIANT {
        string id PK
        string productId FK
        string color
        string colorHex
        string colorTone "Warm | Cool | Neutral"
        string image
        int stockQuantity
    }

    ORDER {
        string id PK
        string userId FK
        string orderNumber UK
        datetime purchaseDateTime
        float subtotal
        float shippingCost
        float discount
        float totalAmount
        string status "Pending | Processing | Delivered | Cancelled"
        string paymentMethod "Visa | Mastercard | PromptPay | COD"
        string shippingMethod "Standard | Express | Same-Day"
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        string productName
        string selectedColor
        string selectedSize
        int quantity
        float unitPrice
        string itemImage
    }

    COUPON {
        string code PK
        float discountPercent
        string couponType "percent | free_shipping"
        boolean isActive
    }
```

### 3.2 MongoDB Schema Specification

#### `products` Collection (เสื้อผ้า กระเป๋า และสินค้าแฟชั่น Personal Color)
```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c0d1" },
  "name": "MatchA Utility Canvas Tote Bag & Boxy Tee Set",
  "description": "Essential daily fashion carry crafted from heavy-duty organic canvas with olive tea-dye shade. Designed to pair with Autumn Warm & Spring Warm personal color palettes.",
  "category": "Bags",
  "price": 54.00,
  "personalColorSeason": "Autumn Warm",
  "tag": "Best Seller",
  "fit": "One Size",
  "inStock": true,
  "sizes": ["OS"],
  "variants": [
    {
      "color": "Matcha Olive (Autumn Warm)",
      "colorHex": "#556B2F",
      "colorTone": "Warm",
      "image": "/images/products/standalone/mustard_sweater.jpg",
      "stockQuantity": 35
    },
    {
      "color": "Slate Mist (Summer Cool)",
      "colorHex": "#64B5F6",
      "colorTone": "Cool",
      "image": "/images/products/standalone/matcha_green_crew.jpg",
      "stockQuantity": 20
    }
  ],
  "createdAt": { "$date": "2026-08-26T00:00:00.000Z" }
}
```

---

## 4. Wireframes & UI Architecture Specifications

![MatchA Application UI Wireframes](./MatchA_App_Wireframes.jpg)

### 4.1 Landing Page & Product List Wireframe
```text
+-----------------------------------------------------------------------------------+
|  🍵 MATCHA COLOR ARCHIVE      [Catalog] [Personal Color Guide] [Bags] 🛒(2) 👤Alex|
+-----------------------------------------------------------------------------------+
|  [ HERO 4-SLICE LOOKBOOK COVER - PERSONAL COLOR CURATIONS ]                       |
|  +----------------+----------------+----------------+----------------+            |
|  | Spring Warm 🌸 | Summer Cool ☀️  | Autumn Warm 🍂 | Winter Cool ❄️  |            |
|  +----------------+----------------+----------------+----------------+            |
+-----------------------------------------------------------------------------------+
|  CHOOSE YOUR SILHOUETTE & BAG FIT                                                 |
|  [ Boxy Tees ] [ Pleated Pants ] [ Tote Bags ] [ Fleece Layers ] [ Bucket Hats ]   |
+-----------------------------------------------------------------------------------+
|  FEATURED COLOR FAVORITES (Product List Layout - 3 Different Tags)                |
|  +-----------------------+ +-----------------------+ +-----------------------+    |
|  | [Tag: Best Seller]    | | [Tag: New Season]     | | [Tag: Vault Archive]  |    |
|  | [ Apparel/Bag Photo ] | | [ Apparel/Bag Photo ] | | [ Apparel/Bag Photo ] |    |
|  | Heavyweight Boxy Tee  | | Utility Canvas Tote   | | Mineral Fleece Hoodie |    |
|  | $48.00                | | $54.00                | | $110.00               |    |
|  | Tone: Spring Warm 🌸  | | Tone: Autumn Warm 🍂  | | Tone: Summer Cool ☀️  |    |
|  | [Color: 🟢 🟤 ⚫]     | | [Color: 🟤 🟢 ⚪]     | | [Color: 🔵 ⚪ ⚫]     |    |
|  | [ 🛒 Add to Cart ]    | | [ 🛒 Add to Cart ]    | | [ 🛒 Add to Cart ]    |    |
|  +-----------------------+ +-----------------------+ +-----------------------+    |
+-----------------------------------------------------------------------------------+
|  FOOTER: (C) 2026 MatchA Personal Color Apparel & Bags. All rights reserved.      |
+-----------------------------------------------------------------------------------+
```

---

### 4.2 Product Card & Customizer Modal Wireframe
```text
+-----------------------------------------------------------------------------------+
|  PRODUCT CARD DETAILED LAYOUT:                                                    |
|  +-----------------------------------------------------------------------------+  |
|  | [TAG: BEST SELLER] (Top Left)                    [❤️ Wishlist] (Top Right)   |  |
|  |                                                                             |  |
|  |                         [ PRODUCT / BAG IMAGE ]                             |  |
|  |                                                                             |  |
|  | [Pill: 🟢 Matcha Olive • Autumn Warm Palette]                                |  |
|  +-----------------------------------------------------------------------------+  |
|  | CATEGORY: BAGS & ACCESSORIES • AUTUMN WARM DROP                            |  |
|  | NAME: MatchA Artisan Utility Canvas Tote Bag                                |  |
|  | DESCRIPTION: Heavy-duty daily bag designed for warm skin tone harmonization. |  |
|  | PRICE: $54.00 USD                                                           |  |
|  | COLOR SWATCHES: (●) Olive Green  (●) Natural Ecru  (●) Charcoal Black       |  |
|  | SIZES:          [ S ]  [ M ]  [ L ]  [ OS* ]                                |  |
|  | ACTIONS:        [ 👁️ Quick View ]  [ 🛒 Quick Add ($54) ]                    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

### 4.3 Shopping Cart Wireframe
```text
+-----------------------------------------------------------------------------------+
|  SHOPPING CART (2 Items)                                                          |
|  Free Shipping Progress: [████████████████████░░░░] $88.00 / $100 ($12 away)       |
+-----------------------------------------------------------------+-----------------+
|  ITEMS IN CART                                                  | ORDER SUMMARY   |
|  +------------------------------------------------------------+ | Subtotal: $88.00|
|  | [IMG] Utility Canvas Tote (Olive / OS)    $54.00           | | Shipping: $10.00|
|  |       Quantity: [ - ] 1 [ + ]             [ 🗑️ Remove ]    | | (Free at $100)|
|  +------------------------------------------------------------+ |                 |
|  | [IMG] Boxy Tee (Ecru / M)                 $34.00           | | TOTAL:   $98.00 |
|  |       Quantity: [ - ] 1 [ + ]             [ 🗑️ Remove ]    | |                 |
|  +------------------------------------------------------------+ | [ CHECKOUT -> ] |
+-----------------------------------------------------------------+-----------------+
```

---

### 4.4 Checkout & Order Confirmation Wireframe (Includes Purchase Date/Time)
```text
+-----------------------------------------------------------------------------------+
|  CHECKOUT FLOW: 1. Address -> 2. Delivery -> 3. Payment                           |
+---------------------------------------------------+-------------------------------+
|  1. SHIPPING ADDRESS                              |  ORDER SUMMARY                |
|  First Name: [ Alex       ] Last Name: [Collector] |  Canvas Tote Bag x1 $54.00    |
|  Email:      [ alex@matcha.vip                   ] |  Boxy Tee x1        $34.00    |
|  Phone:      [ 081-234-5678                      ] |  Coupon: [ MATCHA15 ] [Apply] |
|  Address:    [ 123 Sukhumvit Road, Apt 4B        ] |  Discount (15%):   -$13.20    |
|  City:       [ Bangkok    ] Zip Code: [ 10110    ] |  Shipping:         FREE       |
|                                                   |  TOTAL:            $74.80     |
|  2. PAYMENT METHOD                                +-------------------------------+
|  (*) Visa/Mastercard  ( ) PromptPay QR  ( ) COD   |  [ 🔒 COMPLETE ORDER ($74.80)]|
+---------------------------------------------------+-------------------------------+
|                                                                                   |
|  ORDER CONFIRMATION RECEIPT (MODAL / PAGE):                                       |
|  +-----------------------------------------------------------------------------+  |
|  |  ✅ PAYMENT SUCCESSFUL!                                                      |  |
|  |  Order Number:        #MTA-2026-8942                                        |  |
|  |  Purchase Date/Time:  26 August 2026, 12:00:00 GMT+7 (REQUIRED FIELD)        |  |
|  |  Customer Name:       Alex Collector (alex@matcha.vip)                      |  |
|  |  Payment Method:      Visa Card ending in •••• 8899                         |  |
|  |  Total Paid:          $74.80 USD                                            |  |
|  |  [ CONTINUE SHOPPING ARCHIVE ]                                              |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

### 4.5 Authentication Wireframes

```text
[ LOGIN WIREFRAME ]                       [ REGISTRATION WIREFRAME ]
+-------------------------------+         +-------------------------------------+
|  MATCHA VIP LOGIN             |         |  JOIN MATCHA VIP ARCHIVE            |
|  Email:                       |         |  First Name: [ Alex               ] |
|  [ member@matcha.vip        ] |         |  Last Name:  [ Collector          ] |
|  Password:                    |         |  Email:      [ alex@matcha.vip    ] |
|  [ ••••••••                 ] |         |  Password:   [ ••••••••           ] |
|  [ ] Remember Me              |         |  Confirm:    [ ••••••••           ] |
|  [ 🔑 LOG IN ]                |         |  [ 🟢 CREATE VIP ACCOUNT ]          |
|  [ Forgot Password? ]         |         +-------------------------------------+
|  [ Demo: Admin | Member ]     |
+-------------------------------+
[ FORGOT PASSWORD WIREFRAME ]
+-------------------------------+
|  RESET PASSWORD               |
|  Enter your registered email: |
|  [ alex@matcha.vip          ] |
|  [ 📩 SEND RESET LINK ]       |
+-------------------------------+
```

---

### 4.6 User & Admin Dashboards Wireframe (2 Visualization Charts & Inventory)

```text
+-----------------------------------------------------------------------------------+
|  👑 ADMIN DASHBOARD & INVENTORY MANAGEMENT                                        |
+-----------------------------------------------------------------------------------+
|  [ METRIC 1: Total Revenue: $249,000 ]   [ METRIC 2: Average Order Value: $92.40 ]|
+-----------------------------------------+-----------------------------------------+
|  CHART 1: Monthly Sales Revenue (Bar)   |  CHART 2: Category Distribution (Donut) |
|   $60k |       █                        |            Tops & Tees [45%]            |
|   $40k |   █   █   █                    |            Bags & Accessories [25%]     |
|   $20k | █ █ █ █ █ █                    |            Outerwear [20%]              |
|     $0 +----------------                |            Bottoms [10%]                |
|        Jan Feb Mar Apr May Jun          |                                         |
+-----------------------------------------+-----------------------------------------+
|  ADMIN INVENTORY MANAGEMENT TABLE                                                 |
|  +----+-------------------------------+------------+-------+--------+----------+  |
|  | ID | Item Name                     | Category   | Price | Stock  | Status   |  |
|  +----+-------------------------------+------------+-------+--------+----------+  |
|  | 01 | Heavyweight Boxy Tee          | Tops       | $48   | 45 pcs | In Stock |  |
|  | 02 | Utility Canvas Tote Bag       | Bags       | $54   | 35 pcs | In Stock |  |
|  | 03 | Corduroy Bucket Hat           | Accessories| $38   | 0 pcs  | Out Stock|  |
|  +----+-------------------------------+------------+-------+--------+----------+  |
|  [ + Add New Garment / Bag to Inventory ]                                         |
+-----------------------------------------------------------------------------------+
```

---

## 5. ข้อกำหนดเชิงฟังก์ชันตาม Rubric (Functional Requirements Checklist)

| หมวดหมู่ตาม Rubric | เกณฑ์ที่กำหนด (Rubric Specification) | สถานะความพร้อม | จุดอ้างอิงในโค้ด (File Mapping) |
| :--- | :--- | :--- | :--- |
| **Database & ERD** | Complete BMC, Use Case, ERD, MongoDB Schema สำหรับสินค้าแฟชั่น & กระเป๋า Personal Color | **TRUE (100%)** | [`Requirement.md`](file:///c:/coding/MatchA/Requirement/Requirement.md#1-business-model-canvas-bmc) |
| **Product Card** | Name, Description, Price, Quantity/Add Cart, Tags (3+ tags) | **TRUE (100%)** | [`ProductCard.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/product/ProductCard.jsx), [`ProductModal.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/product/ProductModal.jsx) |
| **Wireframes E-Com** | Card, Landing, Cart, Checkout, Confirmation + Purchase Date/Time | **TRUE (100%)** | Section 4.1 – 4.4 ใน Requirement.md |
| **Auth Wireframes** | Email, First Name, Last Name, Password, Confirm, Forgot PW | **TRUE (100%)** | [`SignUpForm.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/auth/SignUpForm.jsx), [`LoginPage.jsx`](file:///c:/coding/MatchA/app/frontend/src/pages/LoginPage.jsx) |
| **Dashboards** | User UI, Admin 2 Data Visualization Charts, Inventory Management | **TRUE (100%)** | [`UserAccount.jsx`](file:///c:/coding/MatchA/app/frontend/src/pages/UserAccount.jsx), [`AdminDashboardTab.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/account/AdminDashboardTab.jsx) |
| **Implementation** | Tailwind CSS / CSS, Proper labeling & organized layout | **TRUE (100%)** | Tailwind CSS v4 design tokens |

---

## 6. Design Tokens & Personal Color Palette

```css
/* Personal Color & MatchA Palette Tokens */
--color-spring-warm: #E29578;    /* Spring Warm Coral & Peach Accents */
--color-summer-cool: #83C5BE;    /* Summer Cool Soft Sage & Sky */
--color-autumn-warm: #556B2F;    /* Autumn Warm Olive & Matcha Earth */
--color-winter-cool: #1A365D;    /* Winter Cool Deep Cobalt & Charcoal */
--color-brand-canvas: #FAF8F5;   /* Neutral Canvas Background */
--color-brand-earth: #2D231E;    /* Typography & Contrast Surface */
--color-brand-border: #D9D3C7;   /* Structural Borders */
```
