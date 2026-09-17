# MatchA Archive Directory (`_archive/`)

โฟลเดอร์นี้รวบรวมไฟล์คอมโพเนนต์และสคริปต์ที่ **ไม่ได้ถูกเรียกใช้งานใน Production (Dead Code / Prototypes)** เพื่อทำความสะอาดโครงสร้าง Source Code หลักของโปรเจคตามข้อกำหนด **REQ-13 ใน FIX_REQUIREMENTS.md**

---

## 📋 รายการไฟล์ที่ย้ายเข้ามาเก็บรักษา

| ไฟล์ | ขนาดเดิม | สาเหตุที่แยกเก็บ | ตัวแทนจริงที่ระบบใช้งานในปัจจุบัน |
|---|---|---|---|
| `components/catalog/ProductQuickView.jsx` | 344 บรรทัด | คอมโพเนนต์โมดัลสินค้าตัวเก่า ซ้ำซ้อนกับตัวหลัก | `components/product/ProductModal.jsx` |
| `components/catalog/ProductCard.jsx` | 311 บรรทัด | การ์ดสินค้าเวอร์ชันแรก ซ้ำซ้อนกับตัวหลัก | `components/product/ProductCard.jsx` |
| `components/account/AdminDashboardTab.jsx` | 245 บรรทัด | แท็บแอดมินเวอร์ชันก่อนหน้า | รวมอยู่ใน `pages/AdminPage.jsx` สมบูรณ์แล้ว |
| `components/catalog/CatalogFilterDrawer.jsx` | 215 บรรทัด | ตัวกรองแบบ Drawer สำรอง | ตัวกรองหลักใน `pages/CatalogPage.jsx` |
| `pages/Payment.jsx` | 214 บรรทัด | หน้า Checkout เวอร์ชันเก่า ซ้ำกับตัวหลัก | `pages/PaymentPage.jsx` |
| `components/auth/AuthModal.jsx` | 198 บรรทัด | หน้าต่างเข้าสู่ระบบแบบ Modal ไม่เคยถูก mount | ใช้หน้า `pages/LoginPage.jsx` และ `SignUpPage.jsx` |
| `components/cart/CartDrawer.jsx` | 152 บรรทัด | ตะกร้าแบบลิ้นชักสไลด์ข้าง ไม่เคยถูก mount | ใช้หน้าเต็ม `pages/CartPage.jsx` |
| `components/home/LastCallWarehouse.jsx` | 152 บรรทัด | เซกชันโปรโมชันคลังสินค้า ไม่เคยถูก mount | หน้ารวมสินค้าหลักในหน้าแรก |
| `hooks/usePrefersReducedMotion.js` | 19 บรรทัด | Hook ตรวจจับ Motion Preference ไม่เคยถูก import | จัดการผ่าน CSS media query |
| `features/media/media.contract.js` | 18 บรรทัด | สเปคประเภทข้อมูล Stub ที่ไม่ได้ใช้งาน | `features/media/mediaApi.js` |
| `context/index.js` | 4 บรรทัด | Barrel re-export ที่ไม่มีไฟล์ใดเรียกผ่าน | import ตรงจากแต่ละ Context โดยตรง |

---

## ❓ คำถามที่พบบ่อย (FAQ)

### 1. ทำไมต้องย้ายหรือลบไฟล์เหล่านี้?
- **ความสับสนในการพัฒนา (Maintainability)**: ป้องกันไม่ให้ผู้พัฒนาหรือผู้ตรวจโค้ดเผลอไปแก้ไขไฟล์ผิดชุด (เช่น ไปแก้ `Payment.jsx` แต่หน้าเว็บจริงรัน `PaymentPage.jsx`)
- **คะแนน Clean Architecture**: เวลาอาจารย์หรือผู้ประเมินจากบริษัทตรวจดูโค้ด จะประเมินเรื่อง Code Hygiene และการจัดการ Technical Debt
- **ความสะดวกในการค้นหา (IDE Search)**: ลดผลลัพธ์ซ้ำซ้อนเวลา Search หาชื่อ Component ในโปรแกรมแก้ไขโค้ด

### 2. ลบแล้วส่งผลกระทบอะไรต่อระบบไหม?
- **ไม่มีผลกระทบต่อการทำงานของเว็บ 100%**: ไม่มีไฟล์ใดใน `src/` นำเข้า (import) ไฟล์เหล่านี้อยู่แล้ว และ Vite จะไม่นำไฟล์ใน `_archive` ไปรวมใน Bundle ปลายทาง
- **ความเสี่ยงเดียว**: หากในอนาคตต้องการนำ UI บางชิ้นกลับมาใช้ (เช่น อยากเปลี่ยน Cart กลับมาเป็น Drawer) การเก็บไว้ใน `_archive` ช่วยให้หยิบกลับมาใช้งานได้ทันทีโดยไม่ต้องเขียนใหม่หรือขุดประวัติ Git
