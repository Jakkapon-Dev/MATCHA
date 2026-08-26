# MatchA — เอกสารข้อกำหนดและแผนการพัฒนา Sprint 1 (Sprint-01.md)

> **Sprint 1 Goal:** การวางโครงสร้างพื้นฐานระบบ (Monorepo), การออกแบบ Design System & Color Tokens, การพัฒนาหน้าแรก (Homepage / Landing Page), Lookbook Showcase และระบบ Navigation & API Gateway เบื้องต้น

---

## 📌 1. ภาพรวมของ Sprint 1 (Overview)
* **โปรเจกต์:** MatchA — Personal Color Fashion & Artisan Apparel
* **สแต็กเทคโนโลยี:**
  - **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide React, Lenis Smooth Scroll, React Router v7
  - **Backend:** Node.js, Express.js, CORS, RESTful API
* **ขอบเขตงาน:** วางรากฐานโปรเจกต์, เชื่อมต่อ Backend Starter API, สร้างหน้า Homepage ที่มี Hero Section, Lookbook, Personal Color Palette, Choose Your Fit และ Brand Story

---

## 📋 2. รายการงานที่พัฒนาใน Sprint 1 (Sprint 1 Backlog & Tasks)

### 🏗️ Task 1.1: โครงสร้างโปรเจกต์ Monorepo & สภาพแวดล้อมการทำงาน
- [x] จัดโครงสร้างแบบ Monorepo: `app/frontend` (Vite + React) และ `app/backend` (Express.js)
- [x] ตั้งค่า Scripts ควบคุมใน `app/package.json` ด้วย `concurrently` เพื่อรัน `npm run dev` ทั้งคู่พร้อมกัน
- [x] ติดตั้งและกำหนดกฎความปลอดภัยใน `.gitignore`

### 🎨 Task 1.2: Design Tokens & Styling Architecture
- [x] กำหนดชุดสี Personal Color Tokens ใน `index.css`:
  - **Matcha Green (`#2D5A27`):** สีเขียวมัทฉะ Signature
  - **Matcha Cream / Canvas (`#FAF8F5`):** สีพื้นหลังนุ่มนวล
  - **Deep Charcoal / Espresso (`#2D231E`):** สีตัวอักษรและคอนทราสต์หลัก
  - **Terracotta Rust (`#BC5A36`):** สีส้มอิฐ Accent & Badge
  - **Soft Sage (`#D0DEC6`):** สีพื้นผิวรอง
- [x] ผสานระบบ **Lenis Smooth Scroll** เพื่อประสบการณ์การเลื่อนหน้าเว็บที่พรีเมียม

### 🧭 Task 1.3: โครงสร้าง Layout สากล (Global Layout)
- [x] **Navbar Component (`Navbar.jsx`):**
  - Announcement Bar ด้านบน (Free Shipping threshold $100)
  - โลโก้แบรนด์ MatchA
  - เมนูนำทางแบบ Responsive (Home, Catalog, Choose Fit, Cart, Login/Account)
  - ตัวนับจำนวนสินค้าในตะกร้า (Cart Badge Indicator)
- [x] **Footer Component (`Footer.jsx`):**
  - ข้อมูลติดต่อ (Contact Info), About Us, Social Links และ Legal Links

### 🛍️ Task 1.4: คอมโพเนนต์หน้าแรก (Homepage Components)
- [x] **BrandHero (`BrandHero.jsx`):** Hero Section สไตล์มินิมอลคอลเลกชันใหม่
- [x] **PersonalColorSection (`PersonalColorSection.jsx`):** แนะนำพาเลตสี 4 ฤดูกาล (Spring Warm, Summer Cool, Autumn Warm, Winter Cool)
- [x] **LookbookGallery (`LookbookGallery.jsx`):** แสดง Lookbook 4-Slice Cover ภาพแฟชั่นคมชัด
- [x] **ChooseYourFit (`ChooseYourFit.jsx`):** ตัวเลือกแบบจำลองทรงเสื้อผ้า (Boxy Oversized, Relaxed Tailored, Standard Fit)
- [x] **FeaturedDrops (`FeaturedDrops.jsx`):** แสดงสินค้ายอดนิยมพร้อมราคาและปุ่ม Quick View

### 🔌 Task 1.5: เซิร์ฟเวอร์ API เริ่มต้น (Backend API Layer)
- [x] `GET /api/health` — ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์
- [x] `GET /api/categories` — ดึงหมวดหมู่สินค้าและจำนวนคงเหลือ
- [x] `GET /api/products` — ดึงข้อมูลสินค้าพร้อมระบบค้นหาและกรอง (Search & Filter)
- [x] จัดทำ Service Layer `productsApi.js` พร้อมระบบ Fallback รองรับกรณีเซิร์ฟเวอร์ออฟไลน์

---

## 🎯 3. ผลลัพธ์และสถานะการส่งมอบ (Deliverables)
- เว็บไซต์หน้า Homepage รันได้สมบูรณ์บน `http://localhost:5173`
- Backend API รันได้สมบูรณ์บน `http://localhost:5000`
- ผ่านการทดสอบ Build บน Vite production (`npm run build`) ด้วย 0 errors
