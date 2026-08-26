const fs = require('fs');
const path = require('path');

// Helper to create clean, readable Excalidraw boxes with Sans-Serif font (fontFamily: 2)
function createExcalidrawBox({ id, x, y, width, height, strokeColor = '#2D5A27', backgroundColor = '#FAF8F5', fillStyle = 'solid', text = '', title = '', titleColor = '#2D5A27', fontSize = 15, roundness = 3 }) {
  const elements = [];
  const boxId = `box_${id}`;
  const titleId = `title_${id}`;
  const textId = `text_${id}`;

  // Container Rectangle
  elements.push({
    id: boxId,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor,
    backgroundColor,
    fillStyle,
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0, // 0 = Clean Crisp Modern Edges (Ultra readable)
    opacity: 100,
    groupIds: [id],
    frameId: null,
    roundness: { type: roundness },
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
  });

  // Title Text (fontFamily: 2 = Clean Modern Sans-Serif)
  if (title) {
    elements.push({
      id: titleId,
      type: 'text',
      x: x + 16,
      y: y + 14,
      width: width - 32,
      height: 24,
      angle: 0,
      strokeColor: titleColor,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [id],
      text: title,
      fontSize: 17,
      fontFamily: 2, // Modern Clean Sans-Serif
      textAlign: 'left',
      verticalAlign: 'top',
      baseline: 15,
      containerId: null,
      originalText: title,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      isDeleted: false,
    });
  }

  // Body Text (fontFamily: 2 = Clean Modern Sans-Serif)
  if (text) {
    elements.push({
      id: textId,
      type: 'text',
      x: x + 16,
      y: y + (title ? 44 : 16),
      width: width - 32,
      height: height - (title ? 56 : 32),
      angle: 0,
      strokeColor: '#2D231E',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [id],
      text,
      fontSize,
      fontFamily: 2, // Modern Clean Sans-Serif
      textAlign: 'left',
      verticalAlign: 'top',
      baseline: fontSize - 2,
      containerId: null,
      originalText: text,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      isDeleted: false,
    });
  }

  return elements;
}

function createArrow({ id, startX, startY, endX, endY, label = '', strokeColor = '#2D5A27' }) {
  const elements = [];
  const arrowId = `arrow_${id}`;

  elements.push({
    id: arrowId,
    type: 'arrow',
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
    angle: 0,
    strokeColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    points: [
      [0, 0],
      [endX - startX, endY - startY],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  });

  if (label) {
    elements.push({
      id: `label_${id}`,
      type: 'text',
      x: (startX + endX) / 2 - 40,
      y: (startY + endY) / 2 - 14,
      width: 100,
      height: 20,
      angle: 0,
      strokeColor: '#6B5E55',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [],
      text: label,
      fontSize: 13,
      fontFamily: 2,
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 11,
      containerId: null,
      originalText: label,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      isDeleted: false,
    });
  }

  return elements;
}

// 1. GENERATE BUSINESS MODEL CANVAS (BMC)
function generateBMC() {
  const elements = [];

  // Header Title
  elements.push({
    id: 'header_bmc',
    type: 'text',
    x: 80,
    y: 40,
    width: 1000,
    height: 40,
    angle: 0,
    strokeColor: '#2D231E',
    text: '🍵 MATCHA — BUSINESS MODEL CANVAS (Personal Color Fashion & Bag E-Commerce Platform)',
    fontSize: 22,
    fontFamily: 2,
    seed: 1001,
    version: 1,
    isDeleted: false,
  });

  // Top 5 Columns (Height 430)
  // Col 1: Key Partners
  elements.push(...createExcalidrawBox({
    id: 'bmc_kp',
    x: 80,
    y: 100,
    width: 250,
    height: 430,
    strokeColor: '#2D5A27',
    backgroundColor: '#EBF4E8',
    title: '🤝 1. Key Partners',
    text: '• Fashion Brands & Suppliers\n  (แบรนด์เสื้อผ้า กระเป๋า และซัพพลายเออร์)\n• Personal Color Stylists / Analysts\n  (ผู้เชี่ยวชาญการวิเคราะห์โทนสีผิว 4 ฤดู)\n• Fashion & OOTD Influencers\n  (ครีเอเตอร์สาย Personal Color)\n• Delivery Couriers\n  (Kerry, Flash, EMS)\n• Payment Gateway Providers\n  (PromptPay, Visa, Mastercard)',
    fontSize: 13,
  }));

  // Col 2: Key Activities & Key Resources
  elements.push(...createExcalidrawBox({
    id: 'bmc_ka',
    x: 340,
    y: 100,
    width: 250,
    height: 210,
    strokeColor: '#556B2F',
    backgroundColor: '#FAF8F5',
    title: '⚡ 2. Key Activities',
    text: '• คัดสรรเสื้อผ้า กระเป๋า ตาม Personal Color\n• พัฒนาและดูแลระบบ Lookbook & Web Store\n• จัดทำคู่มือ Color Palette Guide แนะนำการแมตช์\n• บริหารสต็อกสินค้า & จัดส่งด่วน VIP Drops',
    fontSize: 13,
  }));

  elements.push(...createExcalidrawBox({
    id: 'bmc_kr',
    x: 340,
    y: 320,
    width: 250,
    height: 210,
    strokeColor: '#556B2F',
    backgroundColor: '#FAF8F5',
    title: '💎 3. Key Resources',
    text: '• แคตตาล็อกสินค้าที่จัดกลุ่ม Color Palette แล้ว\n• สื่อภาพ Lookbook & วิดีโอแฟชั่นสตรีท\n• แพลตฟอร์มเว็บอีคอมเมิร์ซ (React + Vite)\n• แบรนด์ MatchA Personal Color Aesthetic',
    fontSize: 13,
  }));

  // Col 3: Value Propositions (Center)
  elements.push(...createExcalidrawBox({
    id: 'bmc_vp',
    x: 600,
    y: 100,
    width: 270,
    height: 430,
    strokeColor: '#BC5A36',
    backgroundColor: '#FBECE7',
    title: '🎁 4. Value Propositions',
    titleColor: '#BC5A36',
    text: '✨ Shop by Personal Color:\n   เลือกช้อปเสื้อผ้า/กระเป๋าที่ "ขับผิว"\n   (Spring Warm, Summer Cool,\n    Autumn Warm, Winter Cool)\n\n✨ Curated Apparel & Bags:\n   เสื้อผ้าทรงสตรีทแวร์ กระเป๋าแคนวาสคุมโทน\n\n✨ Interactive Color Lookbook:\n   สลับ Color Swatches ได้แบบเรียลไทม์\n   และเลือก Silhouette ทรงเสื้อผ้า 2K Studio\n\n✨ Seamless E-Commerce:\n   ระบบสั่งซื้อสะดวก มีโค้ดส่วนลด และติดตามพัสดุ',
    fontSize: 13,
  }));

  // Col 4: Customer Relationships & Channels
  elements.push(...createExcalidrawBox({
    id: 'bmc_cr',
    x: 880,
    y: 100,
    width: 250,
    height: 210,
    strokeColor: '#D4A338',
    backgroundColor: '#FAF8F5',
    title: '❤️ 5. Relationships',
    titleColor: '#8A6915',
    text: '• MatchA VIP Member Lounge\n• สิทธิ์ Early Drop ซื้อสินค้าก่อนใคร 30 นาที\n• Fit & Personal Color Guide บนหน้าเว็บ\n• ฝ่ายบริการลูกค้าและแจ้งเตือนพัสดุเรียลไทม์',
    fontSize: 13,
  }));

  elements.push(...createExcalidrawBox({
    id: 'bmc_ch',
    x: 880,
    y: 320,
    width: 250,
    height: 210,
    strokeColor: '#D4A338',
    backgroundColor: '#FAF8F5',
    title: '📢 6. Channels',
    titleColor: '#8A6915',
    text: '• เว็บไซต์ MatchA Online Store (Web App)\n• โซเชียลมีเดีย: IG, TikTok, Lemon8, Pinterest\n• จดหมายข่าว VIP Drop List (Email & SMS)\n• Pop-up Event แสดง Lookbook สินค้าจริง',
    fontSize: 13,
  }));

  // Col 5: Customer Segments
  elements.push(...createExcalidrawBox({
    id: 'bmc_cs',
    x: 1140,
    y: 100,
    width: 250,
    height: 430,
    strokeColor: '#1A365D',
    backgroundColor: '#E9EEF5',
    title: '👥 7. Customer Segments',
    titleColor: '#1A365D',
    text: '• Personal Color Enthusiasts:\n  ผู้ที่ต้องการเลือกสีเสื้อผ้า/กระเป๋าให้เข้ากับผิว\n  (Spring, Summer, Autumn, Winter)\n\n• Fashion & Bag Shoppers:\n  คนที่ชอบเสื้อผ้าคุมโทนและกระเป๋าสะพาย\n  สไตล์ Minimal / Streetwear Earth Tone\n\n• Online Shoppers (Gen Z & Millennials):\n  ผู้ซื้อสินค้าออนไลน์ที่เน้นความมั่นใจเรื่องสี',
    fontSize: 13,
  }));

  // Bottom 2 Boxes: Cost Structure & Revenue Streams
  elements.push(...createExcalidrawBox({
    id: 'bmc_cost',
    x: 80,
    y: 545,
    width: 640,
    height: 190,
    strokeColor: '#BC5A36',
    backgroundColor: '#FAF8F5',
    title: '💸 8. Cost Structure (โครงสร้างต้นทุนร้านค้า)',
    titleColor: '#BC5A36',
    text: '• ต้นทุนจัดซื้อสินค้าเสื้อผ้า กระเป๋า และสต็อกสินค้าจากแบรนด์พาร์ทเนอร์\n• ค่าเซิร์ฟเวอร์ Cloud, Web Hosting, Domain & ค่าบำรุงรักษาระบบเว็บ\n• ค่าการตลาด ยิงแอด และการผลิตสื่อถ่ายภาพ Lookbook / Influencer Collabs\n• ค่าธรรมเนียมระบบชำระเงินออนไลน์ (Payment Gateway Fees)',
    fontSize: 13,
  }));

  elements.push(...createExcalidrawBox({
    id: 'bmc_rev',
    x: 735,
    y: 545,
    width: 655,
    height: 190,
    strokeColor: '#2D5A27',
    backgroundColor: '#FAF8F5',
    title: '💰 9. Revenue Streams (กระแสรายได้)',
    titleColor: '#2D5A27',
    text: '• รายได้จากการจำหน่ายเสื้อผ้า กระเป๋าแฟชั่น และแอกเซสซอรีส์ MatchA\n• ค่าบริการจัดส่งด่วนพิเศษ (Express / VIP Priority Shipping)\n• รายได้จาก Limited Seasonal Color Drops เฉพาะสมาชิก VIP\n• ยอดขายจากการจัดเซ็ตคู่สี (Color Palette Bundle Deals)',
    fontSize: 13,
  }));

  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: { viewBackgroundColor: '#FAF8F5' },
    files: {},
  };
}

// 2. GENERATE DATABASE ERD
function generateERD() {
  const elements = [];

  elements.push({
    id: 'header_erd',
    type: 'text',
    x: 80,
    y: 40,
    width: 1000,
    height: 40,
    angle: 0,
    strokeColor: '#2D231E',
    text: '🗄️ MATCHA — ENTITY-RELATIONSHIP DIAGRAM (ERD) & MONGODB SCHEMAS (Clean Sans-Serif)',
    fontSize: 22,
    fontFamily: 2,
    seed: 2001,
    version: 1,
    isDeleted: false,
  });

  // Table 1: USER Entity
  elements.push(...createExcalidrawBox({
    id: 'erd_user',
    x: 80,
    y: 110,
    width: 320,
    height: 270,
    strokeColor: '#1A365D',
    backgroundColor: '#F0F4F9',
    title: '👤 USER Collection',
    titleColor: '#1A365D',
    text: '🔑 _id: ObjectId (PK)\n• firstName: String\n• lastName: String\n• email: String (Unique Index)\n• passwordHash: String (Bcrypt)\n• role: "Member" | "Admin"\n• personalColorType: String\n  (e.g. "Autumn Warm")\n• phone: String\n• createdAt: Date',
    fontSize: 13,
  }));

  // Table 2: ORDER Entity
  elements.push(...createExcalidrawBox({
    id: 'erd_order',
    x: 470,
    y: 110,
    width: 340,
    height: 310,
    strokeColor: '#2D5A27',
    backgroundColor: '#EBF4E8',
    title: '📦 ORDER Collection',
    titleColor: '#2D5A27',
    text: '🔑 _id: ObjectId (PK)\n🔗 userId: ObjectId (FK -> User)\n• orderNumber: String (#MTA-2026-XXXX)\n• purchaseDateTime: Date (Mandatory)\n• customer: { firstName, lastName, email, phone }\n• shippingAddress: { address, city, zipCode }\n• pricing: { subtotal, shipping, discount, total }\n• status: "Processing" | "Delivered"\n• paymentMethod: "visa" | "qr" | "cod"\n• items: Array of OrderItems',
    fontSize: 13,
  }));

  // Table 3: ORDER_ITEM Sub-Schema
  elements.push(...createExcalidrawBox({
    id: 'erd_order_item',
    x: 880,
    y: 110,
    width: 300,
    height: 250,
    strokeColor: '#556B2F',
    backgroundColor: '#FAF8F5',
    title: '🛍️ ORDER_ITEM (Embedded)',
    titleColor: '#556B2F',
    text: '🔑 itemId: ObjectId\n🔗 productId: ObjectId (FK -> Product)\n• productName: String\n• category: "Tops" | "Bags" | "Outerwear"\n• selectedColor: String\n• selectedSize: String ("S" | "M" | "OS")\n• quantity: Number\n• unitPrice: Number\n• itemImage: String (URL)',
    fontSize: 13,
  }));

  // Table 4: PRODUCT Entity
  elements.push(...createExcalidrawBox({
    id: 'erd_product',
    x: 80,
    y: 450,
    width: 360,
    height: 320,
    strokeColor: '#BC5A36',
    backgroundColor: '#FBECE7',
    title: '👕 PRODUCT Collection (Apparel & Bags)',
    titleColor: '#BC5A36',
    text: '🔑 _id: ObjectId (PK)\n• name: String (e.g. "Utility Canvas Tote")\n• description: String\n• category: "Tops" | "Bottoms" | "Bags" | "Accessories"\n• price: Number (USD)\n• personalColorSeason: "Spring Warm" | "Summer Cool" | ...\n• tag: "Best Seller" | "New Season" | "Vault Archive"\n• fit: "Oversized" | "Vintage Boxy" | "One Size"\n• inStock: Boolean\n• variants: Array of ColorVariants\n• createdAt: Date',
    fontSize: 13,
  }));

  // Table 5: VARIANT Sub-Schema
  elements.push(...createExcalidrawBox({
    id: 'erd_variant',
    x: 500,
    y: 470,
    width: 320,
    height: 240,
    strokeColor: '#BC5A36',
    backgroundColor: '#FAF8F5',
    title: '🎨 COLOR VARIANT (Embedded)',
    titleColor: '#BC5A36',
    text: '• color: String (e.g. "Matcha Olive")\n• colorHex: String ("#556B2F")\n• colorTone: "Warm" | "Cool" | "Neutral"\n• image: String (Photo URL)\n• stockQuantity: Number\n• sizes: ["S", "M", "L", "XL", "OS"]',
    fontSize: 13,
  }));

  // Table 6: COUPON Entity
  elements.push(...createExcalidrawBox({
    id: 'erd_coupon',
    x: 880,
    y: 470,
    width: 300,
    height: 220,
    strokeColor: '#D4A338',
    backgroundColor: '#FFF8E6',
    title: '🏷️ COUPON Collection',
    titleColor: '#8A6915',
    text: '🔑 code: String (PK: "MATCHA15")\n• discountPercent: Number (15)\n• couponType: "percent" | "free_shipping"\n• label: String ("15% VIP Discount")\n• minOrder: Number ($50)\n• isActive: Boolean',
    fontSize: 13,
  }));

  // Arrows
  elements.push(...createArrow({ id: 'rel_user_order', startX: 400, startY: 230, endX: 470, endY: 230, label: '1 : N Places' }));
  elements.push(...createArrow({ id: 'rel_order_items', startX: 810, startY: 230, endX: 880, endY: 230, label: '1 : N Contains' }));
  elements.push(...createArrow({ id: 'rel_product_variant', startX: 440, startY: 590, endX: 500, endY: 590, label: '1 : N Has' }));
  elements.push(...createArrow({ id: 'rel_product_orderitem', startX: 440, startY: 490, endX: 880, endY: 280, label: 'Ordered As', strokeColor: '#6B5E55' }));
  elements.push(...createArrow({ id: 'rel_order_coupon', startX: 640, startY: 420, endX: 880, endY: 540, label: 'Applies', strokeColor: '#D4A338' }));

  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: { viewBackgroundColor: '#FAF8F5' },
    files: {},
  };
}

// 3. GENERATE APP WIREFRAMES
function generateWireframes() {
  const elements = [];

  elements.push({
    id: 'header_wireframe',
    type: 'text',
    x: 80,
    y: 40,
    width: 1000,
    height: 40,
    angle: 0,
    strokeColor: '#2D231E',
    text: '🎨 MATCHA — APPLICATION WIREFRAMES & UI ARCHITECTURE (Clean Sans-Serif)',
    fontSize: 22,
    fontFamily: 2,
    seed: 3001,
    version: 1,
    isDeleted: false,
  });

  // Wireframe 1: Landing & Lookbook
  elements.push(...createExcalidrawBox({
    id: 'wf_landing',
    x: 80,
    y: 100,
    width: 380,
    height: 380,
    strokeColor: '#2D5A27',
    backgroundColor: '#FAF8F5',
    title: '📱 1. Landing & Lookbook Cover',
    text: '+----------------------------------------+\n| 🍵 MATCHA     [Catalog] [Color Guide]  🛒👤 |\n+----------------------------------------+\n| [ HERO 4-SLICE PERSONAL COLOR COVER ]   |\n| | Spring 🌸 | Summer ☀️ | Autumn 🍂 | Winter ❄️| |\n+----------------------------------------+\n| CHOOSE YOUR FIT (2K Studio Silhouettes)|\n| [ Boxy Tee ] [ Canvas Tote ] [ Fleece ]|\n+----------------------------------------+\n| STREET FAVORITES (3+ Tags Grid)        |\n| [Best Seller]   [New Season]  [Archive]|\n+----------------------------------------+',
    fontSize: 12,
  }));

  // Wireframe 2: Product Card & Modal
  elements.push(...createExcalidrawBox({
    id: 'wf_card',
    x: 490,
    y: 100,
    width: 380,
    height: 380,
    strokeColor: '#556B2F',
    backgroundColor: '#FAF8F5',
    title: '👕 2. Product Card & Customizer',
    text: '+----------------------------------------+\n| [TAG: BEST SELLER]        [❤️ Wishlist]|\n|                                        |\n|            [ PRODUCT IMAGE ]           |\n|                                        |\n| [🟢 Matcha Olive • Autumn Warm]        |\n+----------------------------------------+\n| Name: MatchA Heavyweight Boxy Tee      |\n| Price: $48.00 USD                      |\n| Color Swatches: (●) Olive  (●) Ecru    |\n| Sizes: [ S ] [ M* ] [ L ] [ XL ]       |\n| Actions: [ 👁️ Quick View ] [ 🛒 Add ]   |\n+----------------------------------------+',
    fontSize: 12,
  }));

  // Wireframe 3: Cart & Checkout
  elements.push(...createExcalidrawBox({
    id: 'wf_cart',
    x: 900,
    y: 100,
    width: 380,
    height: 380,
    strokeColor: '#BC5A36',
    backgroundColor: '#FAF8F5',
    title: '🛒 3. Cart & Multi-Step Checkout',
    text: '+----------------------------------------+\n| SHOPPING CART (Free Ship: $88 / $100)  |\n| • Boxy Tee (Olive/L)     Qty: 1  $48   |\n| • Canvas Tote (Olive/OS) Qty: 1  $54   |\n+----------------------------------------+\n| CHECKOUT STEPPER:                      |\n| 1. Address -> 2. Delivery -> 3. Payment|\n| Payment: (*) Card  ( ) QR  ( ) COD     |\n+----------------------------------------+\n| ✅ RECEIPT: Purchase Date/Time included |\n| Total Paid: $88.00 (Coupon: MATCHA15)  |\n+----------------------------------------+',
    fontSize: 12,
  }));

  // Wireframe 4: Admin Dashboard
  elements.push(...createExcalidrawBox({
    id: 'wf_admin',
    x: 80,
    y: 510,
    width: 600,
    height: 360,
    strokeColor: '#1A365D',
    backgroundColor: '#FAF8F5',
    title: '👑 4. Admin Dashboard (2 Charts & Inventory)',
    titleColor: '#1A365D',
    text: '+--------------------------------------------------------+\n| METRICS: Total Revenue: $249,000 | Avg Order: $92.40    |\n+----------------------------+---------------------------+\n| CHART 1: Sales Revenue Bar | CHART 2: Category Donut   |\n| $60k |       █             |  Tops & Tees [45%]        |\n| $40k |   █   █             |  Bags & Carry [25%]       |\n| $20k | █ █ █ █             |  Outerwear [20%]          |\n|   $0 +-------------        |  Bottoms [10%]            |\n|      Jan Feb Mar           |                           |\n+----------------------------+---------------------------+\n| INVENTORY TABLE: Stock levels, Restock (+10) actions   |\n+--------------------------------------------------------+',
    fontSize: 12,
  }));

  // Wireframe 5: Auth & Registration
  elements.push(...createExcalidrawBox({
    id: 'wf_auth',
    x: 710,
    y: 510,
    width: 570,
    height: 360,
    strokeColor: '#D4A338',
    backgroundColor: '#FAF8F5',
    title: '🔑 5. Auth & User Profile Wireframes',
    titleColor: '#8A6915',
    text: '+----------------------------+---------------------------+\n| LOGIN FORM                 | SIGN UP FORM (Mandatory)  |\n| • Email: [ admin@...     ] | • First Name: [ Alex    ] |\n| • Password: [ ••••••••   ] | • Last Name:  [Collector] |\n| • [ ] Remember Me          | • Email: [ alex@...     ] |\n| • [ 🔑 Log In ]            | • Password: [ ••••••••  ] |\n| • [ Forgot Password? ]     | • Confirm:  [ ••••••••  ] |\n| • Demo: Admin | Member     | • [ 🟢 Create Account ]   |\n+----------------------------+---------------------------+\n| USER ACCOUNT: Details, Orders, Wishlist, Addresses, Prefs |\n+--------------------------------------------------------+',
    fontSize: 12,
  }));

  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: { viewBackgroundColor: '#FAF8F5' },
    files: {},
  };
}

// MAIN EXECUTION
const reqDir = path.resolve('c:/coding/MatchA/Requirement');

const bmcData = generateBMC();
fs.writeFileSync(path.join(reqDir, 'MatchA_Business_Model_Canvas.excalidraw'), JSON.stringify(bmcData, null, 2));

const erdData = generateERD();
fs.writeFileSync(path.join(reqDir, 'MatchA_Database_ERD.excalidraw'), JSON.stringify(erdData, null, 2));

const wfData = generateWireframes();
fs.writeFileSync(path.join(reqDir, 'MatchA_App_Wireframes.excalidraw'), JSON.stringify(wfData, null, 2));

fs.writeFileSync(path.join(reqDir, 'Requirement.excalidraw'), JSON.stringify(bmcData, null, 2));

console.log('✅ Regenerated all Excalidraw files with Modern Sans-Serif font (fontFamily: 2) & Retail Concept successfully!');
