# MatchA Frontend Redesign Plan

## เป้าหมาย

ปรับ Frontend ทั้งระบบให้มีภาพรวมแบบ **Contemporary Thai Fashion Editorial** โดยรักษาทุกหน้า ทุก Section และฟังก์ชันเดิมไว้ พร้อมลดลักษณะของ UI สำเร็จรูปหรือ AI-generated เช่น effect หลายแบบพร้อมกัน, card ซ้อน card, pill จำนวนมาก, glow, gradient, bounce และข้อมูลตัวอย่างที่ดูเหมือนข้อมูลจริง

### Creative Direction Update — Chromatic Fashion Lab

หน้า Home สามารถใช้ความล้ำและ AI-forward ได้เต็มที่ โดยให้โมชั่นทั้งหมดอยู่ในสามตระกูลเดียวกัน: **Slice** สำหรับการประกอบเสื้อผ้า, **Scan** สำหรับการวิเคราะห์สีและเนื้อผ้า และ **Chromatic Shift** สำหรับการส่งสีระหว่าง Section ทุก Section เดิมยังอยู่ครบ แต่ต้องส่งต่อวัตถุ สี หรือจังหวะถึงกันเพื่อให้รู้สึกเป็นประสบการณ์เดียว ไม่ใช่ชุดเอฟเฟกต์แยกกัน

Signature interaction คือ sliced mannequin ที่เริ่มจากลุคสมบูรณ์ เปลี่ยนทีละชิ้นตามการกด แสดงข้อมูลสี/ฤดูกาล และเล่น auto-demo เพียงเมื่อผู้ใช้ยังไม่เริ่มโต้ตอบ ส่วน Catalog, Cart และ Checkout ต้องสงบกว่า Home เพื่อรักษาความสามารถในการเปรียบเทียบและตัดสินใจซื้อ

ผลลัพธ์ที่ต้องการ:

- ลูกค้ารับรู้ได้ทันทีว่า MatchA คือแฟชั่นที่เชื่อม Personal Color, สีงานย้อม และการจัดลุค
- หน้าร้านมีบุคลิกเดียวกัน แต่แต่ละหน้ารองรับงานของผู้ใช้ได้เหมาะสม
- ข้อมูลบัญชี การชำระเงิน คำสั่งซื้อ และ Admin แสดงเฉพาะสถานะจริง
- ใช้งานได้ทั้งเมาส์ คีย์บอร์ด และจอสัมผัส
- รองรับภาษาไทยและอังกฤษอย่างสม่ำเสมอ

## ขอบเขตที่ต้องรักษา

- รักษาทุก route และทุกฟังก์ชันที่มีอยู่
- หน้า Home รักษาทุก Section เดิม
- รักษาพาเลตดำ ขาวนวล เขียวเข้ม และแดง
- รักษา Hero แบบแบ่งโมเดลสี่ส่วน, Personal Color, Mix & Match และ Editorial Lookbook
- ไม่เปลี่ยน API contract หรือ business logic โดยไม่จำเป็น
- Admin ใช้ภาษาภาพเดียวกับแบรนด์ แต่ให้ความเร็วและความชัดเจนมาก่อนความหวือหวา

## Phase 0 — Baseline และความปลอดภัย

**เป้าหมาย:** สร้างจุดอ้างอิงก่อนแก้ UI

- บันทึกภาพ Desktop และ Mobile ของทุก route
- จดสถานะ Loading, Empty, Error, Success และ Demo/Live ของแต่ละหน้า
- ตรวจ build และ backend tests ก่อนเริ่ม
- ระบุข้อมูลจำลองที่ต้องลบหรือเปลี่ยนเป็นสถานะว่าง
- สร้างรายการข้อความ hard-coded ที่ยังไม่ผ่านระบบแปลภาษา

**ผ่านเมื่อ:** มี baseline ครบทุกหน้าและไม่มีข้อสงสัยว่าข้อมูลใดเป็นจริงหรือข้อมูลสาธิต

## Phase 1 — Design Foundation

**ไฟล์หลัก:** `frontend/src/index.css`, `frontend/tailwind.config.js`, components ใน `frontend/src/components/ui`

- กำหนด typography สามระดับ: editorial heading, body sans, mono สำหรับราคา/รหัสเท่านั้น
- กำหนดขนาดข้อความขั้นต่ำ 12px สำหรับ metadata และ 14px สำหรับเนื้อหาหลัก
- กำหนด spacing, border, radius, shadow และ focus ring กลาง
- ใช้มุมเหลี่ยมหรือ radius 2–4px เป็นค่าเริ่มต้น
- กำหนด touch target ขั้นต่ำ 44×44px
- สร้าง motion grammar เดียว: fade/translate ระยะสั้น และเคารพ `prefers-reduced-motion`
- จำกัดแดงสำหรับ CTA/error และเขียวสำหรับ brand/trust/personal color
- สร้างรูปแบบกลางสำหรับ Button, Field, Dialog, Empty State, Error State, Status และ Skeleton

**ผ่านเมื่อ:** หน้าใหม่ไม่ต้องกำหนดสี เงา radius หรือ animation แบบเฉพาะกิจซ้ำ ๆ

## Phase 2 — Trust และ Accessibility ก่อนงานตกแต่ง

**เร่งด่วนที่สุด**

- ลบ Favorites และ Payment Methods ที่สร้างข้อมูลตัวอย่างให้ผู้ใช้
- Preferences/Profile ต้องบันทึกจริง หรือแสดงว่าไม่พร้อมใช้งานอย่างตรงไปตรงมา
- ระบุ Demo Payment และสกุลเงินให้ชัด
- ห้ามสร้างเลขคำสั่งซื้อ ที่อยู่ หรือหลักฐานการชำระเงินสำรองที่ดูเหมือนข้อมูลจริง
- แยก Order API error ออกจาก Empty State
- เปลี่ยน `div onClick` สำหรับตัวเลือกเป็น button/radio ที่ใช้คีย์บอร์ดได้
- เชื่อม label, id, error, `aria-invalid` และ `aria-describedby` ในฟอร์ม
- ทำ Dialog ให้มี focus trap, Escape, initial focus และ restore focus
- เพิ่ม accessible name ให้ icon buttons
- เพิ่ม touch target ทุก action เป็นอย่างน้อย 44px

**ผ่านเมื่อ:** ไม่มีข้อมูลจำลองที่อาจทำให้เข้าใจว่าเป็นข้อมูลบัญชีจริง และ flow หลักใช้งานด้วยคีย์บอร์ดได้

## Phase 3 — Storefront

### Home

- รักษาทุก Section
- ให้ sliced-model hero เป็น signature interaction หลัก
- เริ่มด้วยลุคที่เข้ากัน และเปลี่ยนทีละชิ้นเมื่อผู้ใช้สั่ง
- ลด glow, border beam, holographic sheen, bounce และ motion ต่อเนื่อง
- ทำลำดับเรื่อง: Brand → Fit → Products → Colour → Benefits → Membership
- เปลี่ยนข้อความจำลองบน VIP Card เป็นสิทธิประโยชน์จริง

### Catalog และ Product Quick View

- ทำ Product Card แบบ printed catalogue
- แสดงชื่อสินค้า ชื่อสี ฤดูกาล ราคา ไซซ์ และสถานะสินค้า
- ให้ Add to Cart ใช้งานได้บน touch โดยไม่พึ่ง hover
- ทำ Refine panel และ filter state ให้ชัด
- ใช้ pagination รูปแบบ editorial เช่น `01 / 04`
- Quick View ต้องเลือกสี ไซซ์ จำนวน และเพิ่มตะกร้าได้ครบ

### Personal Color

- หนึ่งคำถามต่อหนึ่งจุดสนใจ พร้อม `QUESTION 02 / 05`
- แสดงตัวเลือกที่เลือกก่อนเปลี่ยนคำถาม
- ให้ผลลัพธ์และ palette เป็นจุดเด่นที่สุด
- แปลคะแนนเป็นภาษาธรรมดา และเก็บทฤษฎีไว้ในรายละเอียดเพิ่มเติม
- CTA หลังผลลัพธ์เชื่อม Catalog และ Mix & Match

**ผ่านเมื่อ:** ผู้ใช้เดินจากการค้นพบแบรนด์ไปยังสินค้าที่เหมาะกับสีของตนได้โดยไม่หลงทาง

## Phase 4 — Styling Experiences

### Mix & Match

- จัดเป็นโต๊ะแต่งลุค: preview ใหญ่, picker เป็น tray/rail
- ลด metric ที่แสดงพร้อมกัน เหลือสรุปความเข้ากันหนึ่งบรรทัด
- ย้าย CIELAB, Itten และ 60/30/10 เข้า disclosure
- ตรวจและ reset ไซซ์เมื่อเปลี่ยนสินค้า
- Mobile flow: Look → Category → Product → Size → Sticky CTA

### Editorial Lookbook

- ให้ภาพและเรื่องราวนำ commerce
- ลด marquee, bounce, radar, Ken Burns และ icon ซ้อน
- Hotspot มือถือเปิดเป็น bottom sheet
- Modal มี focus management ครบ
- ใช้ alt text เฉพาะภาพ และแปล action ทุกจุด

**ผ่านเมื่อ:** ทั้งสองหน้ายังสนุก แต่ผู้ใช้เข้าใจ action หลักและซื้อสินค้าได้โดยไม่ถูก effect รบกวน

## Phase 5 — Commerce Flow

### Cart

- ทำ layout แบบ atelier order sheet
- เพิ่มขนาด quantity/remove controls
- เพิ่ม mobile sticky total + checkout CTA
- ระบุสกุลเงินและเชื่อมข้อความ trust ไปนโยบายจริง
- เพิ่ม semantic progress ให้ free-shipping meter

### Checkout

- จัด flow เป็น `01 ที่อยู่ / 02 ชำระเงิน`
- ลด white cards ซ้อนกัน และทำ summary เหมือนใบเสร็จ
- ใช้ radio/button จริงสำหรับ address, shipping และ payment
- เพิ่ม autocomplete และ inputMode ที่เหมาะสม
- PromptPay ต้องเป็น QR จริง หรือระบุ Demo ชัดเจน
- Success state ต้องใช้ข้อมูลคำสั่งซื้อจากระบบเท่านั้น

### Orders

- ทำรายการแบบ Order Archive
- เพิ่ม View details, Track, Copy order ID และ Help
- แยก Loading, Empty, Error และ Success
- อธิบายขอบเขตของ Guest Orders และการผูกกับบัญชีอย่างตรงไปตรงมา

**ผ่านเมื่อ:** ผู้ใช้เห็นราคา สกุลเงิน วิธีจ่าย และผลคำสั่งซื้อที่เชื่อถือได้ในทุกขั้นตอน

## Phase 6 — Identity และ Account

### Login / Register

- รักษา Atelier Panel
- CTA หลักหนึ่งปุ่มต่อ mode
- ซ่อน Social Login และ Forgot Password จนกว่าจะใช้งานจริง
- เพิ่ม password meter semantics และ error summary
- ให้ URL สะท้อน mode ปัจจุบัน

### User Account

- ปรับเป็น Personal Wardrobe Archive
- แสดง tier และข้อมูลจากระบบจริง
- ทำ tabs ให้มี semantics และ mobile horizontal navigation
- แยก read/edit profile
- ทำ Logout dialog ให้ครบด้าน accessibility
- ทำ empty state ที่ซื่อสัตย์สำหรับ Favorites, Addresses และ Payment Methods

**ผ่านเมื่อ:** ทุกข้อมูลใน Account เป็นข้อมูลของผู้ใช้จริงหรือเป็น empty state ที่ชัดเจน

## Phase 7 — Admin Operate Mode

- เปลี่ยนข้อความแนว Command Center เป็นภาษางานตรงไปตรงมา
- ลด emoji, Sparkles, rounded cards, shadow และ decorative animation
- ทำ mobile top bar + tab scroller/drawer
- เพิ่ม sticky table headers, sort, pagination, filters และ bulk selection
- แสดงเวลาอัปเดตและ retry แยกตาม resource
- ทำ delete confirmation ระบุชื่อและ SKU
- ทำ Add/Edit/Order modals ให้ใช้คีย์บอร์ดได้ครบ
- ระบุ scope, date range, record count และ privacy warning ก่อน export

**ผ่านเมื่อ:** Admin ทำงานหลักได้เร็วบน desktop และ mobile โดยไม่ต้องเลื่อนผ่านเมนูยาวก่อนเห็นข้อมูล

## Phase 8 — Support Pages

### Legal

- เปลี่ยนเป็น policy folio แบบสิ่งพิมพ์
- เพิ่มสารบัญ วันที่แก้ไข และ navigation ที่เข้าถึงได้
- แปล navigation/date/contact ตาม locale
- ตรวจข้ออ้าง SSL, WCAG, shipping, refund และช่องทางติดต่อก่อนเผยแพร่
- Route ที่ไม่รู้จักต้องแสดง Not Found หรือ redirect อย่างชัดเจน

### 404

- รักษาโครงเรียบเดิม
- ทำ Catalog เป็น CTA หลัก
- เพิ่ม search หรือภาพ lookbook หนึ่งภาพโดยไม่เพิ่มเอฟเฟกต์
- ปรับ focus ring และ mobile copy

**ผ่านเมื่อ:** หน้าสนับสนุนอ่านง่าย เชื่อถือได้ และไม่ดูเหมือน SaaS template

## Phase 9 — การตรวจรับ

- ตรวจ Desktop และ Mobile ของทุก route ในหนึ่งรอบ
- ตรวจ keyboard-only flow: nav, filters, quiz, studio, cart, checkout, account และ admin
- ตรวจ reduced motion
- ตรวจภาษาไทย/อังกฤษและข้อความล้น
- ตรวจ Loading, Empty, Error, Success และ Demo/Live states
- รัน build, automated tests และ design detector
- แก้ defect ที่พบเป็น batch แล้วตรวจยืนยันอีกหนึ่งรอบ

## ลำดับการส่งงานที่แนะนำ

1. **PR 1:** Design tokens, typography, controls และ motion foundation
2. **PR 2:** Trust/a11y fixes และลบข้อมูลจำลอง
3. **PR 3:** Home, Catalog, Product Quick View และ Personal Color
4. **PR 4:** Mix & Match และ Lookbook
5. **PR 5:** Cart, Checkout และ Orders
6. **PR 6:** Login, Register และ User Account
7. **PR 7:** Admin
8. **PR 8:** Legal, 404, localization และ final polish

แต่ละ PR ต้อง build ผ่าน ทดสอบ flow ที่เกี่ยวข้อง และมีภาพ Desktop/Mobile ก่อนรวมงาน

## Definition of Done

- ทุกหน้าใช้ typography, spacing, border, focus และ motion system เดียวกัน
- ไม่มีข้อมูลจำลองที่ดูเหมือนข้อมูลส่วนตัวหรือธุรกรรมจริง
- ไม่มี action หลักที่พึ่ง hover เพียงอย่างเดียว
- ปุ่มและตัวเลือกหลักมี touch target อย่างน้อย 44px
- Form และ Dialog ใช้คีย์บอร์ดและ screen reader ได้
- ภาษาไทยและอังกฤษไม่ปนกันโดยไม่ได้ตั้งใจ
- ทุกหน้าแสดง Loading, Empty, Error และ Success อย่างถูกต้อง
- Home ยังคงทุก Section และทุกฟังก์ชันเดิม
- Brand-specific features — sliced mannequin, Personal Color, Dye Archive, Mix & Match และ Lookbook — เด่นกว่าลูกเล่นสำเร็จรูป
