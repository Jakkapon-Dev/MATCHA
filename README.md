# 🍵 MatchA — Modern Artisan Apparel & Personal Color E-Commerce

<p align="center">
  <img src="frontend/public/images/home/matcha-logo.png" alt="MatchA Logo" width="120" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>แพลตฟอร์มแฟชั่นและไลฟ์สไตล์ร่วมสมัย ผสานทฤษฎีสีส่วนบุคคล (Personal Color) และสตูดิโอมิกซ์แอนด์แมตช์ชุดแบบอินเทอร์แอคทีฟ</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Node.js-Express_ESM-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas_Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Sharp-Image_Processing-990000?style=for-the-badge" alt="Sharp" />
</p>

---

## 📌 สารบัญ (Table of Contents)

- [จุดเด่นและฟีเจอร์หลัก (Key Features)](#-จุดเด่นและฟีเจอร์หลัก-key-features)
- [เทคโนโลยีที่ใช้ (Tech Stack)](#-เทคโนโลยีที่ใช้-tech-stack)
- [โครงสร้างโฟลเดอร์ (Directory Structure)](#-โครงสร้างโฟลเดอร์-directory-structure)
- [การติดตั้งและเริ่มต้นใช้งานในเครื่อง (Local Setup)](#-การติดตั้งและเริ่มต้นใช้งานในเครื่อง-local-setup)
- [ตัวแปรสภาพแวดล้อม (Environment Variables)](#-ตัวแปรสภาพแวดล้อม-environment-variables)
- [คำสั่งการรันและทดสอบ (Commands & Testing)](#-คำสั่งการรันและทดสอบ-commands--testing)
- [แนวทางการขึ้นระบบจริง (Deployment Guide)](#-แนวทางการขึ้นระบบจริง-deployment-guide)
- [API Endpoints สำคัญ](#-api-endpoints-สำคัญ)

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
- **Checkout & Coupon Engine**: คำนวณส่วนลด คูปองโปรโมชัน คำนวณยอดสุทธิ และจำลองการชำระเงิน (Demo Payment Gateway)

### 5. 🔐 ระบบสมาชิกและความปลอดภัย (Auth & Security)
- ระบบลงทะเบียน / เข้าสู่ระบบด้วย JWT และรหัสผ่านที่เข้ารหัสด้วย bcrypt
- สมาชิกมีระดับ Tier (`Regular`, `Silver`, `Gold`, `VIP`) พร้อมสิทธิประโยชน์เฉพาะ
- ระบบจัดการที่อยู่จัดส่งหลายรายการ (Multiple Shipping Addresses)
- การป้องกันการโจมตีด้วย `express-rate-limit` และ CORS Dynamic Origin

### 6. ⚙️ Admin Management Dashboard
- จัดการสต็อก เพิ่ม ลบ แก้ไข ข้อมูลสินค้า (Product CRUD)
- จัดการและอัปโหลดรูปภาพผ่าน **Sharp Pipeline** แปลงเป็น WebP พร้อมสร้างรูป Thumbnail อัตโนมัติ
- จัดการ Lookbook และสร้างจุด Hotspot สำหรับทีม Editorial

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (หน้าบ้าน)
- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Smooth Scrolling**: [Lenis](https://lenis.darkroom.engineering/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend (หลังบ้าน)
- **Runtime & Language**: [Node.js](https://nodejs.org/) (Native ES Modules / `type: module`)
- **Web Framework**: [Express 4](https://expressjs.com/)
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose 9](https://mongoosejs.com/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) + [Multer](https://github.com/expressjs/multer)
- **Authentication**: JSON Web Token (`jsonwebtoken`) + `bcryptjs`
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

สร้างไฟล์ `.env` ไว้ในโฟลเดอร์ `backend/`:

```env
# backend/.env
PORT=5001
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/MatchA?appName=Cluster0"
JWT_SECRET="your-super-secret-jwt-key"
SEED_ADMIN_PASSWORD="your-admin-password"
SEED_MEMBER_PASSWORD="your-member-password"
```

สำหรับ `frontend/` (ทางเลือก เมื่อต้องการชี้ไปยัง Production Backend):
```env
# frontend/.env
VITE_API_URL="https://your-backend-api.onrender.com"
```

---

## 🏃 คำสั่งการรันและทดสอบ (Commands & Testing)

### รันเซิร์ฟเวอร์แบบ Full-Stack (Frontend + Backend พร้อมกัน)
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`
- **Backend API URL**: `http://localhost:5001`

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
*(ทดสอบ 14 ชุด ครอบคลุม Auth, Media Upload, Cart Mutation, Lookbook Hotspots)*

---

## ☁️ แนวทางการขึ้นระบบจริง (Deployment Guide)

### 1. หน้าบ้าน (Frontend) — แนะนำ Vercel / Cloudflare Pages
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL` = `<URL ของ Backend>`

### 2. หลังบ้าน (Backend) — แนะนำ Render.com / Railway
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: ตั้งค่า `MONGODB_URI`, `JWT_SECRET` ใน Dashboard
- ⚠️ *อย่าลืมเปิด Network Access ใน MongoDB Atlas เป็น `0.0.0.0/0` เพื่อให้เซิร์ฟเวอร์สามารถเชื่อมต่อได้*

---

## 📡 API Endpoints สำคัญ

| Method | Endpoint | คำอธิบาย | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | ตรวจสอบสถานะของ Server และ Database | Public |
| `GET` | `/api/store-config` | ดึงโหมดการทำงานของร้าน (demo/live) | Public |
| `POST` | `/api/auth/signup` | สมัครสมาชิกใหม่ | Public |
| `POST` | `/api/auth/login` | เข้าสู่ระบบและรับ JWT Token | Public |
| `GET` | `/api/auth/me` | ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน | Member / Admin |
| `GET` | `/api/lookbooks` | ดึงรายการ Lookbook สำหรับแสดงผล | Public |
| `GET` | `/api/media/files/:filename` | ดึงไฟล์รูปภาพ WebP | Public |
| `POST` | `/api/admin/media/upload` | อัปโหลดและแปลงรูปภาพด้วย Sharp | Admin Only |
| `POST` | `/api/admin/lookbooks` | สร้างหรือแก้ไข Editorial Lookbook | Admin Only |

---

<p align="center">
  Crafted with passion by the <strong>MatchA Engineering Team</strong> 🍵
</p>
