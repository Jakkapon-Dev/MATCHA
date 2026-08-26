const fs = require('fs');
const path = require('path');

// Generate 4-Tier Role-Based Use Case Diagram SVG (Thai)
function generate4TierUseCaseSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1560" height="1060" viewBox="0 0 1560 1060" xmlns="http://www.w3.org/2000/svg" font-family="'Sarabun', 'Prompt', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF8F5" />
      <stop offset="100%" stop-color="#EFECE6" />
    </linearGradient>

    <!-- Boundary Gradient -->
    <linearGradient id="boundaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F9F7F2" />
    </linearGradient>

    <!-- Actor Badge Gradients -->
    <linearGradient id="guestBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EAE5DC" />
      <stop offset="100%" stop-color="#D9D3C7" />
    </linearGradient>
    <linearGradient id="memberBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D0DEC6" />
      <stop offset="100%" stop-color="#B4CBAB" />
    </linearGradient>
    <linearGradient id="vipBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3C4" />
      <stop offset="100%" stop-color="#F5DE82" />
    </linearGradient>
    <linearGradient id="adminBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2D8CF" />
      <stop offset="100%" stop-color="#E5BEAF" />
    </linearGradient>

    <!-- Use Case Capsule Gradients -->
    <linearGradient id="browseCapsule" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F4F1EB" />
    </linearGradient>
    <linearGradient id="memberCapsule" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EDF4EA" />
    </linearGradient>
    <linearGradient id="vipCapsule" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FFFBEB" />
    </linearGradient>
    <linearGradient id="adminCapsule" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FAF0EC" />
    </linearGradient>

    <!-- Shadows -->
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#2D231E" flood-opacity="0.08" />
    </filter>

    <!-- Markers for Association Lines -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#2D5A27" />
    </marker>
    <marker id="arrowVip" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#9A7B1C" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="1560" height="1060" fill="url(#bgGrad)" />

  <!-- Diagram Title Header -->
  <g transform="translate(60, 35)">
    <rect x="0" y="0" width="1440" height="75" rx="18" fill="#FFFFFF" stroke="#D9D3C7" stroke-width="1.5" filter="url(#cardShadow)" />
    <circle cx="38" cy="38" r="20" fill="#2D5A27" />
    <text x="38" y="45" font-size="22" text-anchor="middle" fill="#FFFFFF">🍵</text>
    <text x="72" y="34" font-size="21" font-weight="900" fill="#2D231E">MATCHA APPAREL — USE CASE DIAGRAM (4-TIER ROLES)</text>
    <text x="72" y="56" font-size="13" font-weight="700" fill="#2D5A27">โครงสร้างสิทธิ์การใช้งานจำแนก 4 บทบาท (ผู้เยี่ยมชม · สมาชิกทั่วไป · สมาชิก VIP · ผู้ดูแลระบบ)</text>
    <rect x="1290" y="20" width="130" height="36" rx="10" fill="#2D5A27" />
    <text x="1355" y="43" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">เวอร์ชัน 2.0 TH</text>
  </g>

  <!-- SYSTEM BOUNDARY BOX -->
  <rect x="360" y="130" width="840" height="885" rx="28" fill="url(#boundaryGrad)" stroke="#2D5A27" stroke-width="2.5" stroke-dasharray="8 6" filter="url(#cardShadow)" />
  <rect x="390" y="115" width="340" height="32" rx="10" fill="#2D5A27" />
  <text x="560" y="136" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">ขอบเขตระบบ: แพลตฟอร์ม MATCHA (SYSTEM BOUNDARY)</text>

  <!-- ==================== ACTOR 1: GUEST / VISITOR ==================== -->
  <g id="actorGuest" transform="translate(60, 150)">
    <circle cx="110" cy="45" r="26" fill="#FFFFFF" stroke="#6B5E55" stroke-width="2.5" />
    <path d="M 110 71 L 110 120 M 75 88 L 145 88 M 110 120 L 85 160 M 110 120 L 135 160" stroke="#6B5E55" stroke-width="2.5" stroke-linecap="round" />
    <rect x="15" y="175" width="190" height="52" rx="12" fill="url(#guestBadge)" stroke="#6B5E55" stroke-width="1.5" />
    <text x="110" y="196" font-size="13" font-weight="900" fill="#2D231E" text-anchor="middle">👤 ผู้เยี่ยมชม (Guest)</text>
    <text x="110" y="215" font-size="10.5" font-weight="bold" fill="#6B5E55" text-anchor="middle">บุคคลทั่วไป / ยังไม่เข้าสู่ระบบ</text>
  </g>

  <!-- ==================== ACTOR 2: REGULAR MEMBER ==================== -->
  <g id="actorMember" transform="translate(60, 420)">
    <circle cx="110" cy="45" r="26" fill="#FFFFFF" stroke="#2D5A27" stroke-width="3" />
    <text x="110" y="52" font-size="16" text-anchor="middle" fill="#2D5A27">🟢</text>
    <path d="M 110 71 L 110 120 M 75 88 L 145 88 M 110 120 L 85 160 M 110 120 L 135 160" stroke="#2D5A27" stroke-width="3" stroke-linecap="round" />
    <rect x="10" y="175" width="200" height="54" rx="12" fill="url(#memberBadge)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="110" y="196" font-size="13" font-weight="900" fill="#2D5A27" text-anchor="middle">🟢 สมาชิกทั่วไป (Member)</text>
    <text x="110" y="216" font-size="10.5" font-weight="bold" fill="#2D231E" text-anchor="middle">สมัครฟรี / ช้อปปิ้งรอบปกติ</text>
  </g>

  <!-- ==================== ACTOR 3: VIP CONNOISSEUR MEMBER ==================== -->
  <g id="actorVip" transform="translate(60, 710)">
    <circle cx="110" cy="45" r="26" fill="#FFFFFF" stroke="#9A7B1C" stroke-width="3.5" />
    <text x="110" y="52" font-size="16" text-anchor="middle" fill="#9A7B1C">👑</text>
    <path d="M 110 71 L 110 120 M 75 88 L 145 88 M 110 120 L 85 160 M 110 120 L 135 160" stroke="#9A7B1C" stroke-width="3.5" stroke-linecap="round" />
    <rect x="5" y="175" width="210" height="56" rx="12" fill="url(#vipBadge)" stroke="#9A7B1C" stroke-width="2" />
    <text x="110" y="196" font-size="13" font-weight="900" fill="#7A600F" text-anchor="middle">👑 สมาชิก VIP (Connoisseur)</text>
    <text x="110" y="217" font-size="10.5" font-weight="bold" fill="#2D231E" text-anchor="middle">ยอดซื้อ $250+ / Early Access &amp; Vault</text>
  </g>

  <!-- ==================== ACTOR 4: STORE ADMINISTRATOR ==================== -->
  <g id="actorAdmin" transform="translate(1270, 470)">
    <circle cx="110" cy="45" r="28" fill="#FFFFFF" stroke="#BC5A36" stroke-width="3.5" />
    <text x="110" y="53" font-size="18" text-anchor="middle" fill="#BC5A36">⚙️</text>
    <path d="M 110 73 L 110 125 M 70 92 L 150 92 M 110 125 L 80 170 M 110 125 L 140 170" stroke="#BC5A36" stroke-width="3.5" stroke-linecap="round" />
    <rect x="5" y="185" width="210" height="56" rx="12" fill="url(#adminBadge)" stroke="#BC5A36" stroke-width="1.5" />
    <text x="110" y="207" font-size="13" font-weight="900" fill="#BC5A36" text-anchor="middle">👑 ผู้ดูแลระบบ (Store Admin)</text>
    <text x="110" y="228" font-size="10.5" font-weight="bold" fill="#2D231E" text-anchor="middle">ผู้จัดการคลังสินค้าและระบบร้านค้า</text>
  </g>

  <!-- ==================== SECTION 1: PUBLIC USE CASES (GUEST) ==================== -->
  <g transform="translate(400, 160)">
    <rect width="360" height="42" rx="21" fill="url(#browseCapsule)" stroke="#6B5E55" stroke-width="1.5" />
    <text x="180" y="26" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-01: ดูสินค้า Lookbook &amp; กรองหมวดหมู่/สี</text>
  </g>

  <g transform="translate(790, 160)">
    <rect width="370" height="42" rx="21" fill="url(#browseCapsule)" stroke="#6B5E55" stroke-width="1.5" />
    <text x="185" y="26" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-02: ลองแมตช์ชุดเสื้อผ้า (Mix@Match Fit)</text>
  </g>

  <g transform="translate(400, 215)">
    <rect width="360" height="42" rx="21" fill="url(#browseCapsule)" stroke="#6B5E55" stroke-width="1.5" />
    <text x="180" y="26" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-03: ดูรายละเอียดด่วน &amp; เลือกไซส์/สลับสี</text>
  </g>

  <g transform="translate(790, 215)">
    <rect width="370" height="42" rx="21" fill="url(#browseCapsule)" stroke="#6B5E55" stroke-width="1.5" />
    <text x="185" y="26" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-04: จัดการสินค้าในตะกร้าช้อปปิ้ง</text>
  </g>

  <g transform="translate(595, 270)">
    <rect width="360" height="42" rx="21" fill="url(#browseCapsule)" stroke="#2D5A27" stroke-width="2" />
    <text x="180" y="26" font-size="12" font-weight="900" fill="#2D5A27" text-anchor="middle">UC-05: สมัครสมาชิก / เข้าสู่ระบบ (Auth)</text>
  </g>

  <!-- ==================== SECTION 2: REGULAR MEMBER USE CASES ==================== -->
  <g transform="translate(400, 350)">
    <rect width="360" height="44" rx="22" fill="url(#memberCapsule)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="180" y="27" font-size="12" font-weight="bold" fill="#2D5A27" text-anchor="middle">UC-06: สั่งซื้อ &amp; ชำระเงิน PromptPay QR (รอบปกติ)</text>
  </g>

  <g transform="translate(790, 350)">
    <rect width="370" height="44" rx="22" fill="url(#memberCapsule)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="185" y="27" font-size="12" font-weight="bold" fill="#2D5A27" text-anchor="middle">UC-07: ติดตามสถานะและประวัติคำสั่งซื้อ</text>
  </g>

  <g transform="translate(400, 405)">
    <rect width="360" height="44" rx="22" fill="url(#memberCapsule)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="180" y="27" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-08: บันทึกสินค้าชุดโปรด (Saved Archive)</text>
  </g>

  <g transform="translate(790, 405)">
    <rect width="370" height="44" rx="22" fill="url(#memberCapsule)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="185" y="27" font-size="12" font-weight="bold" fill="#2D231E" text-anchor="middle">UC-09: จัดการโปรไฟล์ &amp; สมุดที่อยู่จัดส่ง</text>
  </g>

  <g transform="translate(595, 460)">
    <rect width="360" height="44" rx="22" fill="url(#memberCapsule)" stroke="#2D5A27" stroke-width="1.5" />
    <text x="180" y="27" font-size="12" font-weight="bold" fill="#2D5A27" text-anchor="middle">UC-10: รับข่าวสารและคอลเลกชันใหม่ทางอีเมล</text>
  </g>

  <!-- ==================== SECTION 3: VIP MEMBER EXCLUSIVE USE CASES ==================== -->
  <g transform="translate(400, 545)">
    <rect width="360" height="48" rx="24" fill="url(#vipCapsule)" stroke="#9A7B1C" stroke-width="2" />
    <text x="180" y="29" font-size="12" font-weight="900" fill="#7A600F" text-anchor="middle">UC-11: สั่งซื้อรอบ Early Access (ก่อนใคร 24-48 ชม.)</text>
  </g>

  <g transform="translate(790, 545)">
    <rect width="370" height="48" rx="24" fill="url(#vipCapsule)" stroke="#9A7B1C" stroke-width="2" />
    <text x="185" y="29" font-size="12" font-weight="900" fill="#7A600F" text-anchor="middle">UC-12: เข้าถึงสินค้า Limited Vault &amp; Secret Drops</text>
  </g>

  <g transform="translate(400, 605)">
    <rect width="360" height="48" rx="24" fill="url(#vipCapsule)" stroke="#9A7B1C" stroke-width="2" />
    <text x="180" y="29" font-size="12" font-weight="900" fill="#7A600F" text-anchor="middle">UC-13: ส่วนลด VIP อัตโนมัติ (15-20%) + ฟรี Express</text>
  </g>

  <g transform="translate(790, 605)">
    <rect width="370" height="48" rx="24" fill="url(#vipCapsule)" stroke="#9A7B1C" stroke-width="2" />
    <text x="185" y="29" font-size="12" font-weight="900" fill="#7A600F" text-anchor="middle">UC-14: แจ้งเตือน Drop ด่วนพิเศษทาง SMS/Direct Alert</text>
  </g>

  <!-- ==================== SECTION 4: STORE ADMIN USE CASES ==================== -->
  <g transform="translate(400, 695)">
    <rect width="360" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="180" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-15: เพิ่มสินค้าใหม่เข้าระบบ (+ SKU &amp; รูปภาพ)</text>
  </g>

  <g transform="translate(790, 695)">
    <rect width="370" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="185" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-16: จัดการสต็อก &amp; เติมสินค้าด่วน (+10/-5)</text>
  </g>

  <g transform="translate(400, 755)">
    <rect width="360" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="180" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-17: อัปเดตสถานะออเดอร์ (Pipeline Fulfillment)</text>
  </g>

  <g transform="translate(790, 755)">
    <rect width="370" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="185" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-18: ดูสถิติยอดขาย &amp; กราฟแท่งรายเดือน</text>
  </g>

  <g transform="translate(400, 815)">
    <rect width="360" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="180" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-19: จัดการทะเบียนสมาชิก &amp; สิทธิ์ระดับ VIP</text>
  </g>

  <g transform="translate(790, 815)">
    <rect width="370" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="1.8" stroke-dasharray="4 3" />
    <text x="185" y="28" font-size="12" font-weight="bold" fill="#BC5A36" text-anchor="middle">UC-20: ตรวจสอบสิทธิ์เข้าหน้าระบบแอดมิน (/admin RBAC)</text>
  </g>

  <g transform="translate(595, 875)">
    <rect width="360" height="46" rx="23" fill="url(#adminCapsule)" stroke="#BC5A36" stroke-width="2" />
    <text x="180" y="28" font-size="12" font-weight="900" fill="#BC5A36" text-anchor="middle">UC-21: ส่งออกรายงานข้อมูล &amp; สำรองระบบ (CSV/JSON)</text>
  </g>

  <!-- ==================== ASSOCIATION LINES ==================== -->
  <!-- Guest Lines -->
  <path d="M 230 220 L 400 181" stroke="#6B5E55" stroke-width="1.5" />
  <path d="M 230 225 L 790 181" stroke="#6B5E55" stroke-width="1.5" />
  <path d="M 230 230 L 400 236" stroke="#6B5E55" stroke-width="1.5" />
  <path d="M 230 235 L 790 236" stroke="#6B5E55" stroke-width="1.5" />
  <path d="M 230 240 L 595 291" stroke="#6B5E55" stroke-width="2" />

  <!-- Regular Member Lines -->
  <path d="M 230 490 L 595 291" stroke="#2D5A27" stroke-width="1.6" />
  <path d="M 230 495 L 400 372" stroke="#2D5A27" stroke-width="2" />
  <path d="M 230 500 L 790 372" stroke="#2D5A27" stroke-width="2" />
  <path d="M 230 505 L 400 427" stroke="#2D5A27" stroke-width="2" />
  <path d="M 230 510 L 790 427" stroke="#2D5A27" stroke-width="2" />
  <path d="M 230 515 L 595 482" stroke="#2D5A27" stroke-width="2" />

  <!-- VIP Member Lines -->
  <path d="M 230 780 L 400 569" stroke="#9A7B1C" stroke-width="2.5" />
  <path d="M 230 785 L 790 569" stroke="#9A7B1C" stroke-width="2.5" />
  <path d="M 230 790 L 400 629" stroke="#9A7B1C" stroke-width="2.5" />
  <path d="M 230 795 L 790 629" stroke="#9A7B1C" stroke-width="2.5" />

  <!-- Admin Lines -->
  <path d="M 1300 580 L 760 718" stroke="#BC5A36" stroke-width="2" />
  <path d="M 1300 585 L 1160 718" stroke="#BC5A36" stroke-width="2" />
  <path d="M 1300 590 L 760 778" stroke="#BC5A36" stroke-width="2" />
  <path d="M 1300 595 L 1160 778" stroke="#BC5A36" stroke-width="2" />
  <path d="M 1300 600 L 760 838" stroke="#BC5A36" stroke-width="2" />
  <path d="M 1300 605 L 1160 838" stroke="#BC5A36" stroke-width="2" />

  <!-- Generalization 1: Regular Member extends Guest -->
  <path d="M 170 420 L 170 340" stroke="#2D5A27" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrow)" />
  <rect x="90" y="365" width="160" height="22" rx="6" fill="#D0DEC6" />
  <text x="170" y="380" font-size="9.5" font-weight="bold" fill="#2D5A27" text-anchor="middle">&lt;&lt;สืบทอดสิทธิ์ (extends)&gt;&gt;</text>

  <!-- Generalization 2: VIP Member extends Regular Member -->
  <path d="M 170 710 L 170 635" stroke="#9A7B1C" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrowVip)" />
  <rect x="90" y="660" width="160" height="22" rx="6" fill="#FFF3C4" />
  <text x="170" y="675" font-size="9.5" font-weight="bold" fill="#7A600F" text-anchor="middle">&lt;&lt;สืบทอดสิทธิ์ VIP (extends)&gt;&gt;</text>

  <!-- Legend Bottom -->
  <g transform="translate(60, 1020)">
    <rect x="0" y="0" width="1440" height="28" rx="8" fill="#FAF8F5" stroke="#D9D3C7" />
    <circle cx="20" cy="14" r="5" fill="#6B5E55" />
    <text x="32" y="18" font-size="11" font-weight="bold" fill="#6B5E55">ผู้เยี่ยมชมทั่วไป</text>
    <circle cx="200" cy="14" r="5" fill="#2D5A27" />
    <text x="212" y="18" font-size="11" font-weight="bold" fill="#2D5A27">สมาชิกทั่วไป (Regular Member)</text>
    <circle cx="480" cy="14" r="5" fill="#9A7B1C" />
    <text x="492" y="18" font-size="11" font-weight="bold" fill="#7A600F">สิทธิพิเศษเฉพาะสมาชิก VIP (Early Access &amp; Vault)</text>
    <circle cx="880" cy="14" r="5" fill="#BC5A36" />
    <text x="892" y="18" font-size="11" font-weight="bold" fill="#BC5A36">ระบบผู้ดูแลร้านค้า (Admin Command Center)</text>
  </g>
</svg>`;
}

// Generate 4-Tier Excalidraw JSON
function generate4TierUseCaseExcalidraw() {
  const elements = [];

  function addBox({ id, x, y, width, height, strokeColor = '#2D5A27', backgroundColor = '#FAF8F5', text = '', fontSize = 14, title = '' }) {
    elements.push({
      id: `box_${id}`,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      strokeColor,
      backgroundColor,
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      isDeleted: false,
    });

    const fullText = title ? `${title}\n${text}` : text;
    if (fullText) {
      elements.push({
        id: `text_${id}`,
        type: 'text',
        x: x + 10,
        y: y + 10,
        width: width - 20,
        height: height - 20,
        strokeColor: strokeColor === '#FAF8F5' ? '#2D231E' : strokeColor,
        backgroundColor: 'transparent',
        text: fullText,
        fontSize,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        originalText: fullText,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        isDeleted: false,
      });
    }
  }

  // System Boundary
  addBox({
    id: 'system_boundary',
    x: 340,
    y: 120,
    width: 820,
    height: 860,
    strokeColor: '#2D5A27',
    backgroundColor: '#FAF8F5',
    title: 'ขอบเขตระบบ: แพลตฟอร์ม MATCHA (SYSTEM BOUNDARY)',
    text: '',
    fontSize: 15
  });

  // Actor 1: Guest
  addBox({
    id: 'actor_guest',
    x: 50,
    y: 150,
    width: 230,
    height: 110,
    strokeColor: '#6B5E55',
    backgroundColor: '#EAE5DC',
    title: '👤 ผู้เยี่ยมชม (GUEST)',
    text: '• ดูคอลเลกชัน & Lookbook\n• ลองฟิตติ้ง Mix@Match\n• จัดการตะกร้า & สมัครสมาชิก',
    fontSize: 12.5
  });

  // Actor 2: Regular Member
  addBox({
    id: 'actor_member',
    x: 50,
    y: 380,
    width: 230,
    height: 120,
    strokeColor: '#2D5A27',
    backgroundColor: '#D0DEC6',
    title: '🟢 สมาชิกทั่วไป (MEMBER)',
    text: '• สมัครสมาชิกฟรี\n• สั่งซื้อรอบจำหน่ายปกติ\n• ประวัติออเดอร์ & Saved Archive\n• จัดการที่อยู่จัดส่ง',
    fontSize: 12.5
  });

  // Actor 3: VIP Member
  addBox({
    id: 'actor_vip',
    x: 50,
    y: 650,
    width: 230,
    height: 140,
    strokeColor: '#9A7B1C',
    backgroundColor: '#FFF3C4',
    title: '👑 สมาชิก VIP (CONNOISSEUR)',
    text: '• ยอดสะสม $250+ หรือ 3 ออเดอร์\n• Early Access Drop (ก่อน 24-48 ชม.)\n• Limited Vault & Secret Drops\n• ลด 15-20% อัตโนมัติ + ส่งฟรี Express\n• รับแจ้งเตือนด่วน SMS/Direct',
    fontSize: 12
  });

  // Actor 4: Admin
  addBox({
    id: 'actor_admin',
    x: 1220,
    y: 420,
    width: 240,
    height: 160,
    strokeColor: '#BC5A36',
    backgroundColor: '#F2D8CF',
    title: '👑 ผู้ดูแลระบบ (ADMIN)',
    text: '• Role: Store Administrator\n• เพิ่มสินค้าใหม่ (+ SKU & รูปภาพ)\n• ปรับสต็อกด่วน (+10/-5)\n• จัดการสถานะออเดอร์ลูกค้า\n• วิเคราะห์สถิติ & กราฟยอดขาย\n• จัดการสมาชิกและสิทธิ์ VIP',
    fontSize: 12.5
  });

  // 20 Use Cases
  const useCases4Tier = [
    // Guest Scope
    { id: 'uc_01', x: 380, y: 160, width: 340, height: 44, title: 'UC-01: ดูสินค้า Lookbook & กรองหมวดหมู่/สี', color: '#6B5E55', bg: '#FFFFFF' },
    { id: 'uc_02', x: 780, y: 160, width: 340, height: 44, title: 'UC-02: ลองแมตช์ชุดเสื้อผ้า (Mix@Match)', color: '#6B5E55', bg: '#FFFFFF' },
    { id: 'uc_03', x: 380, y: 215, width: 340, height: 44, title: 'UC-03: ดูรายละเอียดด่วน & เลือกไซส์/สลับสี', color: '#6B5E55', bg: '#FFFFFF' },
    { id: 'uc_04', x: 780, y: 215, width: 340, height: 44, title: 'UC-04: จัดการสินค้าในตะกร้าช้อปปิ้ง', color: '#6B5E55', bg: '#FFFFFF' },
    { id: 'uc_05', x: 580, y: 270, width: 340, height: 44, title: 'UC-05: สมัครสมาชิก / เข้าสู่ระบบ (Auth)', color: '#2D5A27', bg: '#FFFFFF' },

    // Regular Member Scope
    { id: 'uc_06', x: 380, y: 350, width: 340, height: 44, title: 'UC-06: สั่งซื้อ & ชำระเงิน PromptPay (รอบปกติ)', color: '#2D5A27', bg: '#FFFFFF' },
    { id: 'uc_07', x: 780, y: 350, width: 340, height: 44, title: 'UC-07: ติดตามสถานะและประวัติคำสั่งซื้อ', color: '#2D5A27', bg: '#FFFFFF' },
    { id: 'uc_08', x: 380, y: 405, width: 340, height: 44, title: 'UC-08: บันทึกสินค้าชุดโปรด (Saved Archive)', color: '#2D5A27', bg: '#FFFFFF' },
    { id: 'uc_09', x: 780, y: 405, width: 340, height: 44, title: 'UC-09: จัดการโปรไฟล์ & สมุดที่อยู่จัดส่ง', color: '#2D5A27', bg: '#FFFFFF' },
    { id: 'uc_10', x: 580, y: 460, width: 340, height: 44, title: 'UC-10: รับข่าวสารและคอลเลกชันใหม่ทางอีเมล', color: '#2D5A27', bg: '#FFFFFF' },

    // VIP Member Scope
    { id: 'uc_11', x: 380, y: 545, width: 340, height: 48, title: 'UC-11: สั่งซื้อรอบ Early Access (ก่อนใคร 24-48 ชม.)', color: '#9A7B1C', bg: '#FFFFFF' },
    { id: 'uc_12', x: 780, y: 545, width: 340, height: 48, title: 'UC-12: เข้าถึงสินค้า Limited Vault & Secret Drops', color: '#9A7B1C', bg: '#FFFFFF' },
    { id: 'uc_13', x: 380, y: 605, width: 340, height: 48, title: 'UC-13: ส่วนลด VIP อัตโนมัติ (15-20%) + ส่งฟรี Express', color: '#9A7B1C', bg: '#FFFFFF' },
    { id: 'uc_14', x: 780, y: 605, width: 340, height: 48, title: 'UC-14: แจ้งเตือน Drop ด่วนพิเศษทาง SMS/Direct Alert', color: '#9A7B1C', bg: '#FFFFFF' },

    // Admin Scope
    { id: 'uc_15', x: 380, y: 695, width: 340, height: 46, title: 'UC-15: เพิ่มสินค้าใหม่เข้าระบบ (+ SKU & รูปภาพ)', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_16', x: 780, y: 695, width: 340, height: 46, title: 'UC-16: จัดการสต็อก & เติมสินค้าด่วน (+10/-5)', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_17', x: 380, y: 755, width: 340, height: 46, title: 'UC-17: อัปเดตสถานะออเดอร์ (Pipeline Fulfillment)', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_18', x: 780, y: 755, width: 340, height: 46, title: 'UC-18: ดูสถิติยอดขาย & กราฟแท่งรายเดือน', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_19', x: 380, y: 815, width: 340, height: 46, title: 'UC-19: จัดการทะเบียนสมาชิก & สิทธิ์ระดับ VIP', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_20', x: 780, y: 815, width: 340, height: 46, title: 'UC-20: ตรวจสอบสิทธิ์เข้าหน้าระบบแอดมิน (/admin)', color: '#BC5A36', bg: '#FFFFFF' },
    { id: 'uc_21', x: 580, y: 875, width: 340, height: 46, title: 'UC-21: ส่งออกรายงานข้อมูล & สำรองระบบ (CSV/JSON)', color: '#BC5A36', bg: '#FFFFFF' },
  ];

  useCases4Tier.forEach(uc => {
    addBox({
      id: uc.id,
      x: uc.x,
      y: uc.y,
      width: uc.width,
      height: uc.height,
      strokeColor: uc.color,
      backgroundColor: uc.bg,
      title: uc.title,
      text: '',
      fontSize: 12
    });
  });

  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: {
      viewBackgroundColor: '#FAF8F5',
      gridSize: 20
    },
    files: {}
  };
}

// Write files
const outDir = path.resolve(__dirname, '..');
const svgTH = generate4TierUseCaseSVG();
const excalidrawTH = JSON.stringify(generate4TierUseCaseExcalidraw(), null, 2);

fs.writeFileSync(path.join(outDir, 'MatchA_UseCase_Diagram.svg'), svgTH, 'utf8');
fs.writeFileSync(path.join(outDir, 'MatchA_UseCase_Diagram_TH.svg'), svgTH, 'utf8');
fs.writeFileSync(path.join(outDir, 'MatchA_UseCase_Diagram.excalidraw'), excalidrawTH, 'utf8');
fs.writeFileSync(path.join(outDir, 'MatchA_UseCase_Diagram_TH.excalidraw'), excalidrawTH, 'utf8');

console.log('✅ Generated 4-Tier Thai Use Case Diagram (SVG & Excalidraw) successfully!');
