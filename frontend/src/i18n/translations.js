// Single source of truth for every UI string that has been lifted out of JSX.
//
// Scope note: product copy (names, descriptions, colours) is *data*, not UI chrome,
// so it stays in productsData.js / the API and is not mirrored here.
//
// Brand marks are deliberately left untranslated: MatchA, MIX@MATCH, MATCHA15,
// and the FIT-xx / LOOK-xx archive codes read the same in both languages.

export const SUPPORTED_LANGS = ['en', 'th'];
export const DEFAULT_LANG = 'en';

export const translations = {
  en: {
    common: {
      loading: 'Loading products',
      retry: 'Try again',
    },

    nav: {
      demoBanner: 'DEMO SESSION — presentation mode (not connected to the live database)',
      demoExit: '[EXIT DEMO MODE]',
      shippingPromo: 'FREE EXPRESS SHIPPING ON ORDERS OVER $100',
      capsulePromo: 'ECO TEA-DYE CAPSULE NOW LIVE',
      tagline: 'Find Your Match',
      homeAria: 'MatchA Home',
      cartAria: 'View Cart',
      menuAria: 'Toggle Menu',
      links: {
        colorLab: 'Color Lab',
        catalog: 'Catalog',
        lookbook: 'Lookbook',
      },
      adminDashboard: '👑 Admin Dashboard',
      adminTitle: 'Open Admin Command Center',
      adminCenter: '👑 Admin Command Center',
      myAccount: 'My Account',
      myAccountTitle: 'Go to My Account',
      myAccountMobile: '👤 My Account',
      logIn: 'LOG IN',
      signUp: 'SIGN UP',
      logOut: 'LOG OUT',
      logOutMobile: 'Log Out',
      logOutTitle: 'Sign out of MatchA',
      exiting: 'EXITING...',
      exitingMobile: 'Exiting...',
      returnToLanding: 'RETURN TO LANDING LOOKBOOK',
      switchLanguage: 'Switch to Thai',
    },

    footer: {
      contact: 'Contact',
      aboutUs: 'About Us',
      follow: 'Follow',
      legal: 'Legal',
      studio: 'MatchA Flagship Studio',
      address: 'Thong Lo, Sukhumvit 55, Bangkok 10110',
      quote: '"A curated drop for city rebels and everyday legends 🍵👑"',
      about: 'Every garment is crafted to celebrate personal expression, authentic style, and matcha culture.',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      refund: 'Refund Policy',
      shipping: 'Shipping Policy',
      accessibility: 'Accessibility Statement',
      copyright: '© 2026 by MatchA. All rights reserved.',
      designSystem: 'MatchA • Design System Active',
    },

    hero: {
      badges: [
        // The old three lines were streetwear bravado any shop could run, and
        // never mentioned colour or matching — the two things this site is
        // about. These say what the composite model in the middle of the page
        // actually does, and what the visitor gets out of it.
        'ONE LOOK, FOUR PARTS',
        'SWAP ANY OF THEM',
        "FIND THE COLOUR THAT'S YOURS",
      ],
      dropCode: 'DROP_35  //  URBAN',
      runCode: 'CODE  //  LIMITED RUN',
      shopNow: 'SHOP NEW DROPS',
      // The slices have always been clickable; it was only ever said in a
      // `title` attribute, which needs a mouse held still to read and says
      // nothing at all on a phone.
      sliceHint: 'Click any panel to change it',
      findYourColour: 'Find your colour',
      enterWebsite: 'ENTER WEBSITE',
      sliceHead: 'Click to randomize head slice',
      sliceTorso: 'Click to randomize torso slice',
      sliceLower: 'Click to randomize pants/skirt slice',
      sliceShoes: 'Click to randomize footwear slice',
      altHead: 'MatchA Head Slice',
      altTorso: 'MatchA Torso Slice',
      altLower: 'MatchA Pants/Skirt Slice',
      altShoes: 'MatchA Footwear Slice',
    },

    fit: {
      title: 'Choose Your Fit',
      subtitle: 'SIGNATURE SILHOUETTES & FIT GUIDE',
      explore: 'Explore Fit',
      bannerAlt: 'MatchA Choose Your Fit',
      items: {
        'FIT-01': { category: 'Tanks & Polos', count: '34 Items' },
        'FIT-02': { category: 'Oversized Tees', count: '82 Tees' },
        'FIT-03': { category: 'Baggy Denim', count: '58 Fits' },
        'FIT-04': { category: 'Statement Sweats', count: '46 Looks' },
        'FIT-05': { category: 'Tailored Suits', count: '29 Tailored' },
        'FIT-06': { category: 'Utility Outerwear', count: '64 Bottoms' },
      },
    },

    favorites: {
      title: 'Street Favorites',
      viewCatalog: 'VIEW FULL CATALOG',
      prevAria: 'Previous Products',
      nextAria: 'Next Products',
      categories: {
        ALL: 'ALL DROPS',
        Tops: 'TOPS & KNIT',
        Bottoms: 'BOTTOMS & DENIM',
        Outerwear: 'OUTERWEAR',
        Shoes: 'SHOES & FOOTWEAR',
        Accessories: 'ACCESSORIES',
      },
      wakingServer: '⏳ Waking the server up — the first request after a quiet spell can take up to a minute.',
      loadError: 'Could not load the products. Please try again.',
      emptyCategory: 'No products in this category yet',
      viewAll: 'View all products',
      soldOut: 'SOLD OUT',
      soldOutBadge: 'Sold Out',
      selectSize: 'SELECT SIZE',
      addToCart: 'ADD TO CART',
      signatureTone: 'Signature Tone',
    },

    loop: [
      '✦ MATCHA APPAREL',
      'TOKYO // PARIS',
      '✦ ARTISAN STREETWEAR',
      'LIMITED DROP 2026',
      '✦ ORGANIC JAPANESE COTTON',
      'PERSONAL COLOR FORMULAS',
      '✦ 100% SUSTAINABLE TEXTURES',
      'HAUTE ARCHIVE PIECES',
    ],

    video: {
      titleTop: 'MOVEMENT',
      titleBottom: '& EXPRESSION',
      description: 'Experience our organic Japanese cotton textures in real-world motion. Engineered for unrestricted movement in the modern urban landscape.',
      promoBadge: 'SPECIAL PROMO',
      promoCode: 'USE: MATCHA15',
      promoTitle: 'Buy two items get 15% off the total',
      promoBody: 'Mix and match any tops and bottoms from our new MatchA series to unlock your discount automatically at checkout.',
      promoCta: 'Claim 15% Discount',
    },

    perks: {
      title: 'The Pulse Perks',
      badge: '3D LOOKBOOK',
      rotateHint: '↻ MOVE OR DRAG TO ROTATE',
      modelAlt: 'MatchA Seated Lookbook Model',
      items: [
        {
          title: 'LIGHTNING FAST SHIPPING',
          desc: "Get your drip in 48 hours (because the streets won't wait to flex).",
        },
        {
          title: 'EASY STORE CREDIT EXCHANGES',
          desc: 'Wrong size? Swap it fast and keep your fit game flawless.',
        },
        {
          title: 'SECURE CHECKOUT PROTECTION',
          desc: 'Encrypted checkout shields every drop. Shop safe, stay unstoppable.',
        },
      ],
    },

    drop: {
      vipPass: '15% OFF PASS',
      nfc: 'NFC ENABLED // 2026',
      memberAccess: 'Member Access',
      memberName: 'MATCHA COLLECTIVE',
      promoLabel: 'Promo Code',
      cardNote: '✦ Unlock instant 15% discount + private early drop notifications',
      insider: '✦ PRIVATE INSIDER ACCESS',
      title: 'JOIN THE DROP LIST',
      description: 'Receive secret lookbook drops, limited archive releases, and custom personal color formulas delivered directly to your inbox.',
      emailPlaceholder: 'Enter your email address...',
      cta: 'GET VIP ACCESS',
      noSpam: 'NO SPAM EVER. ONLY EXCLUSIVE DROPS & LOOKBOOKS.',
      successTitle: "You're officially on the VIP Drop List!",
      successBodyPrefix: 'Use code',
      successBody: 'at checkout for 15% off.',
      toast: "You're on the VIP Drop List (saved on this device) ✨",
    },
  },

  th: {
    common: {
      loading: 'กำลังดึงข้อมูลสินค้า',
      retry: 'ลองอีกครั้ง',
    },

    nav: {
      demoBanner: 'ตอนนี้เป็นการสาธิต — ใช้สำหรับนำเสนอเท่านั้น ยังไม่ได้ต่อกับฐานข้อมูลจริง',
      demoExit: '[ออกจากการสาธิต]',
      shippingPromo: 'ส่งฟรีแบบด่วน เมื่อซื้อครบ $100',
      capsulePromo: 'ชุดใหม่ ECO TEA-DYE วางขายแล้ว',
      tagline: 'หาสีที่ใช่ในแบบคุณ',
      homeAria: 'กลับไปหน้าแรก MatchA',
      cartAria: 'ดูตะกร้าสินค้า',
      menuAria: 'เปิดหรือปิดเมนู',
      links: {
        colorLab: 'ค้นหาสีประจำตัว',
        catalog: 'สินค้าทั้งหมด',
        lookbook: 'สมุดภาพชุด',
      },
      adminDashboard: '👑 หน้าจัดการระบบ',
      adminTitle: 'เปิดหน้าจัดการระบบ',
      adminCenter: '👑 ศูนย์จัดการระบบ',
      myAccount: 'บัญชีของฉัน',
      myAccountTitle: 'ไปที่บัญชีของฉัน',
      myAccountMobile: '👤 บัญชีของฉัน',
      logIn: 'เข้าสู่ระบบ',
      signUp: 'สมัครสมาชิก',
      logOut: 'ออกจากระบบ',
      logOutMobile: 'ออกจากระบบ',
      logOutTitle: 'ออกจากระบบ MatchA',
      exiting: 'กำลังออก...',
      exitingMobile: 'กำลังออก...',
      returnToLanding: 'กลับไปหน้าสมุดภาพแรก',
      switchLanguage: 'เปลี่ยนเป็นภาษาอังกฤษ',
    },

    footer: {
      contact: 'ติดต่อเรา',
      aboutUs: 'เกี่ยวกับเรา',
      follow: 'ติดตามเรา',
      legal: 'ข้อกำหนดและนโยบาย',
      studio: 'MatchA Flagship Studio',
      address: 'ทองหล่อ สุขุมวิท 55 กรุงเทพฯ 10110',
      quote: '"ชุดคัดสรรสำหรับคนเมืองที่กล้าเป็นตัวเอง 🍵👑"',
      about: 'เสื้อผ้าทุกชิ้นตัดเย็บขึ้นเพื่อให้คุณได้เป็นตัวเอง มีแนวทางของตัวเอง และรักในวัฒนธรรมมัทฉะ',
      privacy: 'นโยบายความเป็นส่วนตัว',
      terms: 'ข้อกำหนดการใช้งาน',
      refund: 'นโยบายการคืนเงิน',
      shipping: 'นโยบายการจัดส่ง',
      accessibility: 'การเข้าถึงเว็บไซต์',
      copyright: '© 2026 MatchA สงวนลิขสิทธิ์',
      designSystem: 'MatchA • ระบบออกแบบทำงานอยู่',
    },

    hero: {
      badges: [
        'หนึ่งลุค สี่ส่วน',
        'สลับได้ทุกส่วน',
        'หาสีที่ใช่กับคุณ',
      ],
      dropCode: 'DROP_35  //  URBAN',
      runCode: 'CODE  //  ทำมาจำนวนจำกัด',
      shopNow: 'ดูของใหม่',
      sliceHint: 'กดที่ช่องไหนก็ได้เพื่อเปลี่ยน',
      findYourColour: 'หาสีของคุณ',
      enterWebsite: 'เข้าสู่เว็บไซต์',
      sliceHead: 'กดเพื่อสุ่มภาพส่วนหัว',
      sliceTorso: 'กดเพื่อสุ่มภาพส่วนลำตัว',
      sliceLower: 'กดเพื่อสุ่มภาพส่วนกางเกงหรือกระโปรง',
      sliceShoes: 'กดเพื่อสุ่มภาพส่วนรองเท้า',
      altHead: 'ภาพส่วนหัวของชุด MatchA',
      altTorso: 'ภาพส่วนลำตัวของชุด MatchA',
      altLower: 'ภาพส่วนกางเกงหรือกระโปรงของชุด MatchA',
      altShoes: 'ภาพส่วนรองเท้าของชุด MatchA',
    },

    fit: {
      title: 'เลือกทรงที่ใช่สำหรับคุณ',
      subtitle: 'ทรงเด่นของเราและวิธีเลือกขนาด',
      explore: 'ดูทรงนี้',
      bannerAlt: 'MatchA เลือกทรงที่ใช่สำหรับคุณ',
      items: {
        'FIT-01': { category: 'เสื้อกล้ามและเสื้อคอปก', count: '34 ตัว' },
        'FIT-02': { category: 'เสื้อยืดทรงหลวม', count: '82 ตัว' },
        'FIT-03': { category: 'กางเกงยีนส์ทรงหลวม', count: '58 ตัว' },
        'FIT-04': { category: 'เสื้อแขนยาวลายเด่น', count: '46 ตัว' },
        'FIT-05': { category: 'ชุดสูทตัดพิเศษ', count: '29 ชุด' },
        'FIT-06': { category: 'เสื้อคลุมใส่ได้ทุกวัน', count: '64 ตัว' },
      },
    },

    favorites: {
      title: 'ที่คนเมืองเลือกใส่',
      viewCatalog: 'ดูสินค้าทั้งหมด',
      prevAria: 'สินค้าก่อนหน้า',
      nextAria: 'สินค้าถัดไป',
      categories: {
        ALL: 'ทั้งหมด',
        Tops: 'เสื้อและไหมพรม',
        Bottoms: 'กางเกงและยีนส์',
        Outerwear: 'เสื้อคลุม',
        Shoes: 'รองเท้า',
        Accessories: 'เครื่องประดับ',
      },
      wakingServer: '⏳ ระบบกำลังเริ่มทำงาน ครั้งแรกอาจต้องรอนานถึงหนึ่งนาที',
      loadError: 'ดึงข้อมูลสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง',
      emptyCategory: 'ยังไม่มีสินค้าในหมวดนี้',
      viewAll: 'ดูสินค้าทั้งหมด',
      soldOut: 'ของหมด',
      soldOutBadge: 'ของหมด',
      selectSize: 'เลือกขนาด',
      addToCart: 'ใส่ตะกร้า',
      signatureTone: 'สีเฉพาะของเรา',
    },

    loop: [
      '✦ MATCHA APPAREL',
      'โตเกียว // ปารีส',
      '✦ เสื้อผ้าจากช่างฝีมือ',
      'ทำมาจำนวนจำกัด 2026',
      '✦ ผ้าฝ้ายญี่ปุ่นปลอดสารเคมี',
      'สูตรสีประจำตัวคุณ',
      '✦ ผ้าที่ดีต่อสิ่งแวดล้อม 100%',
      'ของจากคลังสะสม',
    ],

    video: {
      titleTop: 'เคลื่อนไหว',
      titleBottom: 'และเป็นตัวเอง',
      description: 'ลองสัมผัสผ้าฝ้ายญี่ปุ่นปลอดสารเคมีของเราตอนขยับจริง เราทำมาให้คุณเคลื่อนไหวได้เต็มที่ในทุกจังหวะของเมือง',
      promoBadge: 'ข้อเสนอพิเศษ',
      promoCode: 'ใช้รหัส: MATCHA15',
      promoTitle: 'ซื้อสองชิ้น ลด 15% จากยอดรวม',
      promoBody: 'เลือกเสื้อกับกางเกงชิ้นไหนก็ได้จากชุดใหม่ของ MatchA ระบบจะลดให้เองตอนจ่ายเงิน',
      promoCta: 'รับส่วนลด 15%',
    },

    perks: {
      title: 'สิทธิพิเศษของสมาชิก',
      badge: 'สมุดภาพสามมิติ',
      rotateHint: '↻ เลื่อนเมาส์หรือลากนิ้วเพื่อหมุน',
      modelAlt: 'ภาพแบบในสมุดภาพชุดของ MatchA',
      items: [
        {
          title: 'ส่งเร็วภายใน 48 ชั่วโมง',
          desc: 'ได้ของภายใน 48 ชั่วโมง พร้อมใส่ออกไปได้ทันที',
        },
        {
          title: 'เปลี่ยนขนาดง่าย เก็บยอดไว้ใช้ครั้งหน้า',
          desc: 'ถ้าขนาดไม่พอดี เปลี่ยนได้เร็ว จะได้ใส่แล้วพอดีตัวจริง ๆ',
        },
        {
          title: 'จ่ายเงินปลอดภัยทุกครั้ง',
          desc: 'ทุกคำสั่งซื้อถูกเข้ารหัสไว้ เลือกซื้อได้สบายใจ',
        },
      ],
    },

    drop: {
      vipPass: 'บัตรลด 15%',
      nfc: 'NFC ENABLED // 2026',
      memberAccess: 'สิทธิ์สมาชิก',
      memberName: 'MATCHA COLLECTIVE',
      promoLabel: 'รหัสส่วนลด',
      cardNote: '✦ ลดทันที 15% พร้อมรู้ข่าวของใหม่ก่อนใคร',
      insider: '✦ สิทธิพิเศษเฉพาะสมาชิก',
      title: 'รับข่าวของใหม่ก่อนใคร',
      description: 'รับสมุดภาพชุดเฉพาะกลุ่ม ของจากคลังสะสมรุ่นจำกัด และสูตรสีประจำตัวคุณ ส่งตรงถึงอีเมล',
      emailPlaceholder: 'กรอกอีเมลของคุณ',
      cta: 'รับสิทธิพิเศษ',
      noSpam: 'เราไม่ส่งข้อความกวนใจ มีแต่ข่าวของใหม่และสมุดภาพชุดเท่านั้น',
      successTitle: 'คุณอยู่ในรายชื่อรับข่าวแล้ว!',
      successBodyPrefix: 'ใช้รหัส',
      successBody: 'ตอนจ่ายเงิน เพื่อรับส่วนลด 15%',
      toast: 'คุณอยู่ในรายชื่อรับข่าวแล้ว (เก็บไว้ในเครื่องของคุณ) ✨',
    },
  },
};
