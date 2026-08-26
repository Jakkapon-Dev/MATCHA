# MatchA — เอกสารข้อกำหนดและการประเมินผล Sprint 1 (Sprint-01.md)

> **Sprint 1 Goal:** การวางโครงสร้างพื้นฐานระบบ (Monorepo), การออกแบบ Design System & Color Tokens, การพัฒนาหน้าแรก (Homepage / Landing Page), Lookbook Showcase และระบบ Navigation & API Gateway เบื้องต้น

---

## 📊 ตารางตรวจสอบเกณฑ์การประเมิน Sprint 1 (Assessment Checklist & Project Audit)

| รหัสงาน (Task ID) | เกณฑ์การประเมิน (Assessment Criteria) | สถานะใน MatchA | ไฟล์อ้างอิงที่พัฒนาแล้ว (Reference Files) |
| :--- | :--- | :---: | :--- |
| **Task 1.1** | โครงสร้าง Monorepo และการจัดการ Workspace แยก `frontend` (React Vite) และ `backend` (Express.js) | ✅ **ผ่านแล้ว (100%)** | [`app/package.json`](file:///c:/coding/MatchA/app/package.json), [`app/backend/package.json`](file:///c:/coding/MatchA/app/backend/package.json), [`app/frontend/package.json`](file:///c:/coding/MatchA/app/frontend/package.json) |
| **Task 1.2** | ติดตั้งและตั้งค่า `concurrently` ใน Root Script เพื่อรัน Frontend และ Backend พร้อมกันในคำสั่งเดียว (`npm run dev`) | ✅ **ผ่านแล้ว (100%)** | [`app/package.json`](file:///c:/coding/MatchA/app/package.json) $\to$ `"scripts": { "dev": "concurrently ..." }` |
| **Task 1.3** | การตั้งค่าความปลอดภัยและการละเว้นไฟล์ไม่จำเป็นบน Git ([`.gitignore`](file:///c:/coding/MatchA/.gitignore)) | ✅ **ผ่านแล้ว (100%)** | [`.gitignore`](file:///c:/coding/MatchA/.gitignore) (ป้องกัน `node_modules`, `.env*`, `dist/`, logs, caches, export dumps) |
| **Task 2.1** | ออกแบบ Design System, Color Tokens และ Typography ที่ตรงตามอัตลักษณ์ของแบรนด์ (MatchA Aesthetic) | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/index.css`](file:///c:/coding/MatchA/app/frontend/src/index.css) (กำหนดโทนสีมัทฉะ, ครีม, เอิร์ธโทน, ฟอนต์ Google Fonts) |
| **Task 2.2** | พัฒนาระบบ Global Navigation Bar (`Navbar.jsx`) แบบ Responsive มี Announcement Bar และ Cart Counter | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/layout/Navbar.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/layout/Navbar.jsx) |
| **Task 2.3** | พัฒนาส่วนท้ายของเว็บไซต์ (`Footer.jsx`) แสดงข้อมูลติดต่อ, พันธกิจแบรนด์, ลิงก์โซเชียลมีเดีย และข้อกำหนดทางกฎหมาย | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/layout/Footer.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/layout/Footer.jsx) |
| **Task 2.4** | การรวมระบบการเลื่อนหน้าจอที่ลื่นไหลแบบพรีเมียม (Lenis Smooth Scroll Integration) | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/layout/Layout.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/layout/Layout.jsx) & `lenis` library |
| **Task 3.1** | พัฒนา Hero Section หน้าแรก (`BrandHero.jsx`) แสดงคอลเลกชันใหม่ สโลแกน และปุ่ม Call-to-Action (CTA) | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/home/BrandHero.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/home/BrandHero.jsx) |
| **Task 3.2** | พัฒนาฟังก์ชันแนะนำโทนสีผิวประจำตัว (`PersonalColorSection.jsx`) จำแนก 4 ฤดูกาล (Spring, Summer, Autumn, Winter) | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/home/PersonalColorSection.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/home/PersonalColorSection.jsx) |
| **Task 3.3** | พัฒนา Lookbook Gallery (`LookbookGallery.jsx`) แสดงภาพถ่ายแฟชั่น 4-Slice Interactive Cover | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/home/LookbookGallery.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/home/LookbookGallery.jsx) |
| **Task 3.4** | พัฒนาตัวเลือกแบบจำลองทรงเสื้อผ้า (`ChooseYourFit.jsx`) (Boxy Oversized, Relaxed Tailored, Standard Fit) | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/components/home/ChooseYourFit.jsx`](file:///c:/coding/MatchA/app/frontend/src/components/home/ChooseYourFit.jsx) |
| **Task 3.5** | พัฒนาเซิร์ฟเวอร์ Express.js API เริ่มต้น (`server.js`) พร้อมระบบ Health Check และ Product Data Listing | ✅ **ผ่านแล้ว (100%)** | [`app/backend/server.js`](file:///c:/coding/MatchA/app/backend/server.js) (`/api/health`, `/api/categories`, `/api/products`) |
| **Task 3.6** | พัฒนา API Service Client Layer พร้อมระบบ Fallback ป้องกันเว็บล่มเมื่อเซิร์ฟเวอร์ออฟไลน์ | ✅ **ผ่านแล้ว (100%)** | [`app/frontend/src/services/productsApi.js`](file:///c:/coding/MatchA/app/frontend/src/services/productsApi.js) |
| **Coding Fluency** | สถาปัตยกรรมโค้ดเป็นระเบียบ, แยกหน้าที่ Component ชัดเจน และผ่านการทดสอบ Build ด้วย 0 errors | ✅ **ผ่านแล้ว (100%)** | ผ่านการทดสอบ `node test_syntax.js` และ `npm run build` ใน 2.6s |

---

## 📝 รายละเอียดข้อกำหนดเชิงเทคนิคฉบับสมบูรณ์ (Technical Specifications)

### 🔹 Task 1: Monorepo Architecture & Environment Setup
1. **โครงสร้างโฟลเดอร์โปรเจกต์ (Directory Structure):**
   ```text
   MatchA/
   ├── app/
   │   ├── backend/         # Express.js API Server
   │   │   ├── data/        # Seed datasets (products, categories)
   │   │   ├── server.js    # Entry point & RESTful Endpoints
   │   │   └── package.json
   │   ├── frontend/        # React 18 + Vite Web App
   │   │   ├── src/         # Components, Pages, Context, Hooks
   │   │   ├── index.html
   │   │   └── package.json
   │   └── package.json     # Concurrently scripts
   ├── Requirement/         # Full SRS, BMC, ERD, Use Case, Sprint Docs
   └── .gitignore           # Security and exclusion rules
   ```
2. **การตั้งค่า Scripts ควบคุม:**
   - คำสั่ง `npm run dev`: เริ่มทำงานทั้ง Backend (`localhost:5000`) และ Frontend (`localhost:5173`) พร้อมกัน
   - คำสั่ง `npm run build`: คอมไพล์โปรเจกต์ Frontend สำหรับ Production

---

### 🔹 Task 2: Design System & Global Layout
1. **Design Tokens & Color Palette:**
   - **Matcha Green (`#2D5A27`):** Primary Brand Color
   - **Soft Sage (`#D0DEC6`):** Secondary / Surface Light
   - **Matcha Cream (`#FAF8F5`):** Background Canvas
   - **Deep Charcoal (`#2D231E`):** Typography & Contrasts
   - **Terracotta Rust (`#BC5A36`):** Accent & Status Badge
2. **Responsive Navigation Bar:**
   - แสดง Announcement Bar โปรโมชันด้านบนสุด
   - แสดงโลโก้ `MatchA | Artisan Color Archive`
   - เมนูแบบ Desktop (Links) และ Mobile Drawer (Hamburger Menu)
   - Cart Counter Badge พร้อมแอนิเมชันเมื่อมีสินค้าในตะกร้า
3. **Smooth Scroll Experience:**
   - ติดตั้งและตั้งค่า Lenis Smooth Scroll เพื่อความลื่นไหลระดับพรีเมียม

---

### 🔹 Task 3: Homepage Components & Starter Backend API
1. **Hero Section (`BrandHero.jsx`):**
   - ส่วนหัวขนาดใหญ่ แสดงคอลเลกชันประจำซีซันพร้อมปุ่มนำทางสู่แคตตาล็อก
2. **Personal Color Theory (`PersonalColorSection.jsx`):**
   - แสดงแนวคิดและเฉดสีของทั้ง 4 ฤดูกาล: Spring Warm, Summer Cool, Autumn Warm, Winter Cool
3. **Interactive Lookbook (`LookbookGallery.jsx`):**
   - การแสดงภาพ Lookbook แบบ 4-Slice Interactive พร้อมรองรับการคลิกดูภาพขยาย
4. **Choose Your Fit (`ChooseYourFit.jsx`):**
   - นำเสนอสไตล์และทรงเสื้อผ้า 3 รูปแบบหลักของ MatchA
5. **Backend RESTful Endpoints (`server.js`):**
   - `GET /api/health` — ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์
   - `GET /api/categories` — รายการหมวดหมู่สินค้าและจำนวนสินค้าในแต่ละหมวด
   - `GET /api/products` — รายการสินค้าพร้อมระบบค้นหาและฟิลเตอร์ (Search & Filter)
6. **Graceful Degradation / Fallback:**
   - เมื่อ Backend ออฟไลน์ Frontend จะสลับไปใช้ Local Fallback Data โดยอัตโนมัติ ทำให้ผู้ใช้ยังสามารถสำรวจเว็บไซต์ได้อย่างราบรื่น

---

## 🎯 ผลลัพธ์และสถานะการส่งมอบ (Deliverables)
- เว็บไซต์หน้า Homepage รันได้สมบูรณ์บน `http://localhost:5173`
- Backend API รันได้สมบูรณ์บน `http://localhost:5000`
- ผ่านการทดสอบ Build บน Vite production (`npm run build`) ด้วย 0 errors และ 0 warnings
