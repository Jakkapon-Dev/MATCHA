# 🍵 MatchA — Modern Artisan Apparel & Personal Color E-Commerce

<p align="center">
  <img src="frontend/public/images/brand/matcha-logo-primary.png" alt="MatchA Logo" width="220" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>แพลตฟอร์มแฟชั่นและไลฟ์สไตล์ร่วมสมัย ผสานทฤษฎีสีส่วนบุคคล (Personal Color) และสตูดิโอมิกซ์แอนด์แมตช์ชุดแบบอินเทอร์แอคทีฟ</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.4.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-000000?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Node.js-Express_ESM-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Backend-Render.com-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render" />
</p>

---

## 🌐 ลิงก์ระบบออนไลน์ (Live Production Demo)

สำหรับผู้ทดสอบ สามารถเข้าชมและทดสอบระบบได้ทันที:

- **Frontend Web Application (Production)**: [`https://matcha-inky.vercel.app`](https://matcha-inky.vercel.app)
- **Backend API Server**: [`https://matcha-gluk.onrender.com`](https://matcha-gluk.onrender.com)
- **API Health Check**: [`https://matcha-gluk.onrender.com/api/health`](https://matcha-gluk.onrender.com/api/health)
- **Database System**: MongoDB Atlas Cloud Cluster (Connected 🟢)
- **API Documentation Root**: [`https://matcha-gluk.onrender.com/`](https://matcha-gluk.onrender.com/)

> 💡 *หมายเหตุสำหรับ Render Free Tier*: หากไม่มีการใช้งานเกิน 15 นาที เซิร์ฟเวอร์จะเข้าสู่โหมดประหยัดพลังงาน (Sleep) การเรียกใช้งานครั้งแรกอาจใช้เวลาตื่น (Cold Start) ประมาณ 30–50 วินาที

---

## 📌 สารบัญ (Table of Contents)

- [ลิงก์ระบบออนไลน์ (Live Production Demo)](#-ลิงก์ระบบออนไลน์-live-production-demo)
- [เอกลักษณ์แบรนด์และธีมสี (Brand Identity & Palette)](#-เอกลักษณ์แบรนด์และธีมสี-brand-identity--palette)
- [จุดเด่นและฟีเจอร์หลัก (Key Features)](#-จุดเด่นและฟีเจอร์หลัก-key-features)
- [เทคโนโลยีที่ใช้ (Tech Stack)](#-เทคโนโลยีที่ใช้-tech-stack)
- [โครงสร้างโฟลเดอร์ (Directory Structure)](#-โครงสร้างโฟลเดอร์-directory-structure)
- [การติดตั้งและเริ่มต้นใช้งานในเครื่อง (Local Setup)](#-การติดตั้งและเริ่มต้นใช้งานในเครื่อง-local-setup)
- [ตัวแปรสภาพแวดล้อม (Environment Variables)](#-ตัวแปรสภาพแวดล้อม-environment-variables)
- [คำสั่งการรันและทดสอบ (Commands & Testing)](#-คำสั่งการรันและทดสอบ-commands--testing)
- [แนวทางการขึ้นระบบจริง (Deployment Guide)](#-แนวทางการขึ้นระบบจริง-deployment-guide)
- [API Endpoints สำคัญ](#-api-endpoints-สำคัญ)

---

## 🎨 เอกลักษณ์แบรนด์และธีมสี (Brand Identity & Palette)

การออกแบบของ MatchA ยึดปรัชญา **"เขียวแดงแค่ MATCHA logo ที่เหลือ ขาว-ดำ"** (Monochrome High-Fashion with Signature Red & Green Logo Accents):

| สี | รหัส Hex | บทบาทในระบบ (Usage) |
| :--- | :---: | :--- |
| **Deep Forest Green** | `#042509` | ตัวอักษร MATCH บน Hero Masthead, แบรนด์แอ็กเซนต์ |
| **Pure Black** | `#000000` | ตัวอักษรหลัก, ปุ่ม CTA สำคัญ, Header Bar, เส้นขอบหลัก |
| **Matcha Leaf Green** | `#518F5C` | ริบบิ้นด้านขวาของตัวอักษร **"A"** ในโลโก้, ป้ายและไอคอน |
| **Clean Off-White** | `#F1F1F1` | พื้นหลังทั้งเว็บไซต์ (Canvas Background) สบายตาและโมเดิร์น |
| **Crimson Red** | `#C91D1D` | ริบบิ้นด้านซ้ายของตัวอักษร **"A"** ในโลโก้, จุดแจ้งเตือน, ปุ่ม Shop Drops |

---

## ✨ จุดเด่นและฟีเจอร์หลัก (Key Features)

### 1. 🎨 Personal Color Diagnostic Studio
- **แบบทดสอบจำแนกสีผิว 4 ฤดูกาล**: วิเคราะห์ Undertone, Contrast, และความสว่างของผิวเพื่อหาฤดูกาลที่แท้จริง (`Spring`, `Summer`, `Autumn`, `Winter`)
- **ชุดสีเฉพาะบุคคล (Signature Palette)**: แนะนำเฉดสีที่ช่วยขับออร่า และระบุสีที่ควรหลีกเลี่ยง
- **Color Theory Encyclopedia**: คลังความรู้ทฤษฎี 4 ฤดูกาลพร้อมคำแนะนำเนื้อผ้าและเครื่องประดับที่เหมาะสม

### 2. 🥋 Mix & Match Styling Studio
- เครื่องมือทดลองแมตช์ชุดสตรีทแวร์แบบอินเทอร์แอคทีฟ
- สามารถเลือกปรับเปลี่ยน หมวก เสื้อ กางเกง และรองเท้า พร้อมแสดงผล Preview รวมทุกลุคแบบเรียลไทม์
- สั่งเพิ่มทุกลุคลงตะกร้าสินค้าได้ทันทีในคลิกเดียว

### 3. 📖 Editorial Lookbook & Interactive Hotspots
- เล่าเรื่องราวคอลเลกชันแบบแมกกาซีนแฟชั่นระดับไฮเอนด์
- มีจุดพินสินค้า (Interactive Hotspots) บนภาพนางแบบ กดเพื่อดูรายละเอียดสินค้าจริงและสั่งซื้อได้ทันที

### 4. 🛍️ ระบบ E-Commerce ครบวงจร
- **Product Catalog & Filtering**: ค้นหา กรองตามฤดูกาล หมวดหมู่ และสถานะสต็อก
- **Cart Management**: รองรับทั้ง Guest Cart (ผูกผ่าน UUID ใน LocalStorage) และสมาชิก พร้อมฟังก์ชัน Merge Cart อัตโนมัติเมื่อเข้าสู่ระบบ
- **Checkout & Payment Engine**: รองรับการชำระเงินจริงใน Test mode ผ่าน Stripe (บัตรเครดิต/เดบิต), PromptPay QR Code และ Cash on Delivery (COD) พร้อมระบบคูปองส่วนลดและกลไกจองสต็อก/คืนสต็อกอัตโนมัติ (Reservation Sweeper)

### 5. 🔐 ระบบสมาชิกและความปลอดภัย (Auth & Security)
- ระบบลงทะเบียน / เข้าสู่ระบบด้วย JWT และ Firebase Authentication (รองรับ Google Sign-In, Email Verification, และ Password Reset)
- สมาชิกมีระดับ Tier (`Regular`, `Silver`, `Gold`, `VIP`) พร้อมสิทธิประโยชน์เฉพาะ
- ระบบจัดการที่อยู่จัดส่งหลายรายการ (Multiple Shipping Addresses)
- การป้องกันการโจมตีด้วย `express-rate-limit` (Shared Counter), CORS Dynamic Origin และ Secure Auth Guards

### 6. ⚙️ Admin Management Dashboard
- จัดการสต็อก เพิ่ม ลบ แก้ไข ข้อมูลสินค้า (Product CRUD พร้อม Size-Aware Restock)
- จัดการและอัปโหลดรูปภาพผ่าน Cloudinary และ **Sharp Pipeline** แปลงเป็น WebP พร้อม Thumbnail อัตโนมัติ
- จัดการ Lookbook และสร้างจุด Hotspot สำหรับทีม Editorial

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (หน้าบ้าน)
- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) (v6.4.3)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation & Scrolling**: [Motion](https://motion.dev/) + [Lenis](https://lenis.darkroom.engineering/)
- **Payment & Auth**: Stripe Elements (`@stripe/react-stripe-js`, `@stripe/stripe-js`) + Firebase Client SDK
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend (หลังบ้าน)
- **Runtime & Language**: [Node.js](https://nodejs.org/) (Native ES Modules / `type: module`)
- **Web Framework**: [Express 4](https://expressjs.com/)
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose 9](https://mongoosejs.com/)
- **Payment Gateway**: [Stripe SDK](https://stripe.com/)
- **Email Service**: [Resend API](https://resend.com/)
- **Image Processing & Storage**: [Cloudinary](https://cloudinary.com/) + [Sharp](https://sharp.pixelplumbing.com/) + [Multer](https://github.com/expressjs/multer)
- **Authentication**: Firebase Admin / Web Token Verification + JSON Web Token (`jsonwebtoken`) + `bcryptjs`
- **Validation**: [Zod](https://zod.dev/)

---

## 📁 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
MATCHA/
├── frontend/                     # ซอร์สโค้ด React + Vite Client
│   ├── public/                   # สื่อสาธารณะ (รูปภาพ, ไอคอน, Demo Images)
│   ├── src/
│   │   ├── components/           # UI Components แยกตามส่วนงาน (Cart, Home, Product, ฯลฯ)
│   │   ├── context/              # React Context (Auth, Cart, Toast)
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── pages/                # หน้าหลักของแอปพลิเคชัน (12 หน้า)
│   │   ├── services/             # Client API Service Configuration
│   │   └── styles/               # CSS Tokens & Animations
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # ซอร์สโค้ด Node.js Express REST API
│   ├── config/                   # การตั้งค่าระบบ (Store Mode, DB)
│   ├── middleware/               # Auth Guard, Rate Limiting, Error Handling
│   ├── models/                   # Mongoose Data Schemas (User, Product, Order, Cart, Lookbook, ฯลฯ)
│   ├── routes/                   # API Route Handlers
│   ├── services/                 # Business Logic (UserStore, MediaStorage, Lookbook)
│   ├── storage/                  # โฟลเดอร์เก็บไฟล์รูปภาพที่ผ่านการบีบอัด
│   ├── tests/                    # ชุดทดสอบ Unit & Integration Tests (14 Tests)
│   ├── package.json
│   └── server.js                 # จุดเริ่มต้นของ Backend Server
│
├── test-support/                 # Helper utilities สำหรับการทดสอบ
├── package.json                  # Root Workspace Configuration (Concurrently scripts)
└── README.md                     # เอกสารโปรเจกต์
```

---

## 🚀 การติดตั้งและเริ่มต้นใช้งานในเครื่อง (Local Setup)

### 1. โคลน Repository
```bash
git clone https://github.com/Jakkapon-Dev/MATCHA.git
cd MATCHA
```

### 2. ติดตั้ง Dependencies ทั้งหมดในคำสั่งเดียว
```bash
npm run install:all
```
*(คำสั่งนี้จะทำการ `npm install` ทั้งที่ Root, Backend และ Frontend ให้อัตโนมัติ)*

---

## 🔑 ตัวแปรสภาพแวดล้อม (Environment Variables)

คัดลอกไฟล์ตัวอย่าง `backend/.env.example` ไปเป็น `backend/.env`:

```env
# backend/.env
PORT=5001
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.hak50ja.mongodb.net/MatchA?appName=Cluster0"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
ADMIN_SEED_PASSWORD="your-admin-password"
```

### เปิดใช้งานอีเมลจริงบน Render

ระบบส่งอีเมลยืนยันคำสั่งซื้อและลิงก์ตั้งรหัสผ่านผ่าน Resend โดยไม่เก็บคีย์ไว้ในโค้ด:

1. สร้าง API key ใน Resend แล้วคัดลอกไว้ชั่วคราว (ห้ามใส่ใน Git หรือ `VITE_` variable)
2. ใน Render → **MATCHA → Environment** เพิ่มตัวแปร `RESEND_API_KEY` เป็น API key นั้น
3. เพิ่ม `EMAIL_FROM` เป็นอีเมลจากโดเมนที่ยืนยันแล้วใน Resend เช่น `orders@your-domain.com`
4. กด **Save, rebuild, and deploy** แล้วสั่งซื้อทดสอบหนึ่งรายการ

ถ้ายังไม่ตั้งค่าสองตัวแปรนี้ ระบบจะยังรับออเดอร์ได้ตามปกติ แต่จะข้ามการส่งอีเมลและแจ้งเตือนใน log เท่านั้น

สำหรับ `frontend/` (คัดลอก `frontend/.env.example` ไปเป็น `frontend/.env` เพื่อชี้ไปยัง Production Cloud Backend):
```env
# frontend/.env
VITE_API_URL="https://matcha-gluk.onrender.com"
```
*(หากต้องการทดสอบแบบ Localhost ในเครื่องตนเอง สามารถลบหรือปล่อย `VITE_API_URL` ว่างไว้ได้ ระบบจะใช้ Proxy เชื่อมต่อไปยัง `localhost:5001` โดยอัตโนมัติ)*

---

## 🏃 คำสั่งการรันและทดสอบ (Commands & Testing)

### รันเซิร์ฟเวอร์แบบ Full-Stack (Frontend + Backend พร้อมกัน)
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`
- **Backend API URL**: `http://localhost:5001` (หรือชี้ไปยัง `https://matcha-gluk.onrender.com`)

### รันแยกเฉพาะส่วน
```bash
# รันเฉพาะ Backend
npm run dev:backend

# รันเฉพาะ Frontend
npm run dev:frontend
```

### รันชุดทดสอบ Backend (Automated Tests)
```bash
cd backend
npm test
```
*(ทดสอบ 336 รายการใน 3 suites ครอบคลุม Auth, Payment Lifecycle, Reservation Sweeper, Media Upload, Cart Mutation, Admin Aggregates)*

### รันชุดทดสอบ Frontend (Automated Tests)
```bash
cd frontend
npm test
```
*(ทดสอบ 67 รายการใน 12 files ด้วย Vitest ครอบคลุม Cart, Orders, Favorites, Address Book, Admin Hooks)*

### รันการทดสอบ End-to-End (E2E Tests)
```bash
npm run test:e2e
```
*(ทดสอบ End-to-End ด้วย Playwright 5 specs)*

---

## ☁️ แนวทางการขึ้นระบบจริง (Deployment Guide)

### 1. หลังบ้าน (Backend บน Render.com) 🟢 Active
- **Live URL**: [`https://matcha-gluk.onrender.com`](https://matcha-gluk.onrender.com)
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: ตั้งค่า `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` ใน Render Dashboard
- ⚠️ **การตั้งค่า MongoDB Atlas**: เข้าไปที่ [MongoDB Atlas](https://cloud.mongodb.com) -> **Network Access** -> เพิ่ม IP `0.0.0.0/0` (Allow Access from Anywhere) เพื่อให้ Render สามารถเชื่อมต่อฐานข้อมูลได้ตลอดเวลา

### 2. หน้าบ้าน (Frontend) — Vercel / Cloudflare Pages / Render Static Site
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL=https://matcha-gluk.onrender.com`

---

## 📡 API Endpoints สำคัญ

| Method | Endpoint | คำอธิบาย | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | ตรวจสอบสถานะของ Server และ Database | Public |
| `GET` | `/api/categories` | ดึงรายชื่อหมวดหมู่สินค้าพร้อมจำนวนสินค้า | Public |
| `GET` | `/api/products` | ค้นหา กรอง และแบ่งหน้าสินค้า (Catalog Search & Filter) | Public |
| `GET` | `/api/store-config` | ดึงโหมดการทำงานของร้าน (demo/live) | Public |
| `POST` | `/api/auth/register` | สมัครสมาชิกใหม่พร้อมเข้ารหัส bcrypt | Public |
| `POST` | `/api/auth/login` | เข้าสู่ระบบและรับ JWT Token | Public |
| `GET` | `/api/auth/me` | ตรวจสอบข้อมูลผู้ใช้ปัจจุบันจาก JWT Token | Member / Admin |
| `GET` | `/api/lookbooks` | ดึงรายการ Lookbook สำหรับแสดงผล | Public |
| `GET` | `/api/media/files/:filename` | ดึงไฟล์รูปภาพ WebP | Public |
| `POST` | `/api/admin/media/upload` | อัปโหลดและแปลงรูปภาพด้วย Sharp Pipeline | Admin Only |
| `POST` | `/api/admin/lookbooks` | สร้างหรือแก้ไข Editorial Lookbook และ Hotspots | Admin Only |

---

<p align="center">
  Crafted with passion by the <strong>MatchA Engineering Team</strong> 🍵
</p>
