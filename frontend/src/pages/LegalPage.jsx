import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Truck, RotateCcw, Eye } from 'lucide-react';
import PreviewBadge from '../components/ui/PreviewBadge';
import NotFoundPage from './NotFoundPage';
import { useLanguage } from '../context/LanguageContext.jsx';

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    titleTh: 'นโยบายความเป็นส่วนตัวและสิทธิในข้อมูล',
    icon: ShieldCheck,
    updated: 'September 25, 2026 (v1.2)',
    sections: [
      {
        heading: '1. ข้อมูลที่เราจัดเก็บจริง (Data We Actually Collect)',
        content: 'MatchA จัดเก็บข้อมูลส่วนบุคคลเฉพาะที่จำเป็นต่อการให้บริการซื้อขายสินค้าแฟชั่นออนไลน์ ได้แก่: (ก) ข้อมูลบัญชีสมาชิก (ชื่อ นามสกุล อีเมล หมายเลขโทรศัพท์ และรหัสผ่านที่ผ่านการแฮชด้วย bcrypt ทางฝั่งเซิร์ฟเวอร์ หรือรหัสระบุตัวตนจาก Google OAuth) (ข) ข้อมูลสมุดที่อยู่สำหรับจัดส่งสินค้า (ค) บันทึกประวัติคำสั่งซื้อและยอดชำระเงิน (ง) ภาพโปรไฟล์สมาชิกที่เลือกอัปโหลด และ (จ) ผลวิเคราะห์คู่สีจาก Personal Color Quiz ที่บันทึกไว้บนอุปกรณ์ของท่าน'
      },
      {
        heading: '2. ผู้ประมวลผลข้อมูลและโครงสร้างพื้นฐาน (Sub-processors & Cloud Infrastructure)',
        content: 'ระบบใช้บริการคลาวด์มาตรฐานสากลในการประมวลผลและจัดเก็บข้อมูลอย่างปลอดภัย: (1) Google Firebase Authentication สำหรับการระบุตัวตนและตรวจสอบสิทธิ์เข้าใช้งาน (Google Sign-In / Email verification), (2) MongoDB Atlas สำหรับฐานข้อมูลหลักในการจัดเก็บบัญชีผู้ใช้ ตะกร้าสินค้า คำสั่งซื้อ และสมุดที่อยู่, (3) Stripe สำหรับรับชำระเงินด้วยบัตรและ PromptPay (ข้อมูลบัตรถูกกรอกและประมวลผลบนระบบของ Stripe โดยตรง MatchA ไม่จัดเก็บเลขบัตร), (4) Resend สำหรับส่งอีเมลยืนยันคำสั่งซื้อและอีเมลแจ้งเตือนของระบบ, (5) Cloudinary สำหรับจัดเก็บและแปลงขนาดรูปภาพโปรไฟล์และมีเดีย, (6) Render Services Inc. สำหรับโฮสต์เซิร์ฟเวอร์ Backend API (Node.js/Express) พร้อมบันทึก Application Log, และ (7) Vercel Inc. สำหรับโฮสต์เว็บแอปพลิเคชันส่วนหน้า (Edge CDN Delivery)'
      },
      {
        heading: '3. การจัดเก็บข้อมูลบนอุปกรณ์ของผู้ใช้ (Cookies & Local Storage Disclosure)',
        content: 'เว็บไซต์ MatchA ไม่ใช้คุกกี้เพื่อการติดตามพฤติกรรมข้ามเว็บไซต์ (No third-party tracking cookies) แต่ใช้พื้นที่จัดเก็บในเบราว์เซอร์ (LocalStorage / SessionStorage) เท่าที่จำเป็นต่อการทำงานของระบบ ได้แก่: `matcha_token` และ `matcha_user` (สถานะการเข้าสู่ระบบและข้อมูลโปรไฟล์พื้นฐาน เช่น ชื่อ อีเมล และระดับสมาชิก), `matcha_guest_id` (รหัสสุ่มสำหรับเชื่อมโยงตะกร้าและคำสั่งซื้อของผู้ที่ยังไม่เข้าสู่ระบบ), `matcha_cart` และ `matcha_demo_cart` (สินค้าในตะกร้า), `matcha_wishlist` (รายการสินค้าที่บันทึกไว้), `matcha_saved_looks` (ลุคที่บันทึกจากหน้า Lookbook), `matcha:addresses:` ตามด้วยรหัสบัญชี (สำเนาสมุดที่อยู่ของบัญชีเพื่อให้หน้าชำระเงินแสดงผลได้เร็ว), `matcha_applied_coupon` (คูปองที่กดรับไว้ รอใช้ตอนชำระเงิน), `matcha_personal_color` และ `matcha_personal_color_reading` (ผลวิเคราะห์ Personal Color), `matcha_verify_cooldown_until` (ระยะรอก่อนส่งอีเมลยืนยันซ้ำ) และ `matcha:lang` (ภาษาที่เลือกใช้งาน) เมื่อออกจากระบบ ระบบจะลบข้อมูลการเข้าสู่ระบบ ตะกร้าที่แสดงบนหน้าจอ รายการสินค้าที่บันทึกไว้ และลุคที่บันทึกไว้ออกจากเบราว์เซอร์นั้น'
      },
      {
        heading: '4. ความยินยอมด้านการตลาด (Marketing Consent — Opt-In)',
        content: 'การรับข่าวสาร สิทธิพิเศษ VIP Drop และโปรโมชัน เป็นรูปแบบสมัครใจ (Opt-In) โดยระบบจะบันทึกสถานะการให้ความยินยอมพร้อมเวอร์ชันของนโยบายและวันเวลาไว้บนเซิร์ฟเวอร์ สมาชิกสามารถตรวจสอบ เปลี่ยนแปลง หรือเพิกถอนความยินยอมได้ตลอดเวลาในหน้า Preferences ของบัญชีผู้ใช้'
      },
      {
        heading: '5. สิทธิและการขอลบข้อมูล (Data Deletion & Retention vs Compliance)',
        content: 'สมาชิกมีสิทธิยื่นคำขอลบข้อมูลส่วนบุคคล (Data Deletion Request) ผ่านระบบสมาชิกในหน้าบัญชี หรือส่งอีเมลมาที่ contact@matcha-archive.com เมื่อได้รับการยืนยัน ข้อมูลโปรไฟล์ บัญชีผู้ใช้ และสมุดที่อยู่จะถูกลบทิ้งอย่างถาวร สำหรับ "ประวัติคำสั่งซื้อและธุรกรรมทางการเงินในอดีต" ตามประมวลรัษฎากรและกฎหมายว่าด้วยการบัญชี ร้านค้ามีหน้าที่ต้องเก็บรักษาเอกสารทางการค้าไว้อย่างน้อย 5 ปี ระบบจะใช้วิธีนิรนามข้อมูล (Anonymization) โดยการลบชื่อ เบอร์โทรศัพท์ และที่อยู่จัดส่งออกจากรายการสั่งซื้อเดิม เพื่อไม่ให้สามารถสืบหาตัวตนบุคคลได้ แต่ยังคงตัวเลขยอดขายและรายการสินค้าเพื่อการตรวจสอบบัญชีตามกฎหมาย'
      },
      {
        heading: '6. ข้อกำหนดทางกฎหมายที่ต้องตรวจทาน (Notice for Business Owner Review)',
        content: '[IMPORTANT NOTICE FOR BUSINESS OWNER]: ข้อความในนโยบายฉบับนี้ร่างขึ้นตามสถาปัตยกรรมทางเทคนิคจริงของระบบ MatchA ณ วันที่ 21 กันยายน 2569 เจ้าของธุรกิจควรนำเอกสารนี้ให้ที่ปรึกษากฎหมายหรือเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ตรวจทานถ้อยคำและชื่อนิติบุคคลผู้ควบคุมข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) พ.ศ. 2562 ให้ถูกต้องครบถ้วนก่อนเปิดบริการเชิงพาณิชย์เต็มรูปแบบ'
      }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    titleTh: 'ข้อกำหนดและเงื่อนไขการใช้บริการ',
    icon: FileText,
    updated: 'January 15, 2026',
    sections: [
      {
        heading: '1. ข้อกำหนดทั่วไป',
        content: 'การเข้าชม สั่งซื้อ หรือใช้งานบริการบนเว็บไซต์ MatchA ถือว่าท่านยอมรับข้อกำหนดและเงื่อนไขทั้งหมดที่ระบุไว้ในหน้านี้ กรุณาอ่านและทำความเข้าใจอย่างละเอียด'
      },
      {
        heading: '2. ลิขสิทธิ์และทรัพย์สินทางปัญญา',
        content: 'การออกแบบ เสื้อผ้า ภาพถ่าย เครื่องหมายการค้า และเนื้อหาทั้งหมดบนเว็บไซต์นี้เป็นทรัพย์สินทางปัญญาของ MatchA ห้ามคัดลอก ดัดแปลง หรือนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร'
      },
      {
        heading: '3. คำสั่งซื้อและราคาสินค้า',
        content: 'ราคาสินค้าทั้งหมดแสดงในสกุลเงินดอลลาร์สหรัฐ ($) หรือเทียบเท่า โดยราคาสินค้าและค่าจัดส่งอาจมีการปรับเปลี่ยนตามโปรโมชันหรือฤดูกาลโดยไม่ต้องแจ้งให้ทราบล่วงหน้า'
      }
    ]
  },
  refund: {
    title: 'Refund & Return Policy',
    titleTh: 'นโยบายการคืนสินค้าและการคืนเงิน',
    icon: RotateCcw,
    updated: 'February 1, 2026',
    sections: [
      {
        heading: '1. ระยะเวลาการขอคืนสินค้า',
        content: 'ลูกค้าสามารถแจ้งความประสงค์ขอเปลี่ยนหรือคืนสินค้าได้ภายใน 14 วันนับจากวันที่ได้รับสินค้า โดยสินค้าต้องอยู่ในสภาพเดิม 100% ไม่ผ่านการซัก ป้ายสินค้ายังอยู่ครบถ้วน'
      },
      {
        heading: '2. เงื่อนไขสินค้าที่ไม่สามารถคืนได้',
        content: 'สินค้าในกลุ่มลดราคาพิเศษ (Final Sale) สินค้าสั่งผลิตเฉพาะบุคคล (Custom Made) หรือสินค้าของแถมจากโปรโมชัน ไม่สามารถขอคืนเป็นเงินสดได้ เว้นแต่พบข้อบกพร่องจากการผลิต'
      },
      {
        heading: '3. ขั้นตอนการคืนเงิน',
        content: 'เมื่อทีมงานได้รับสินค้าและตรวจสอบสภาพเรียบร้อยแล้ว การคืนเงินจะดำเนินการผ่านช่องทางชำระเงินเดิมของท่านภายใน 7-14 วันทำการ'
      }
    ]
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    titleTh: 'นโยบายและอัตราค่าจัดส่ง',
    icon: Truck,
    updated: 'January 20, 2026',
    sections: [
      {
        heading: '1. รูปแบบและอัตราค่าจัดส่ง',
        content: 'เราให้บริการจัดส่ง 2 รูปแบบหลัก: การจัดส่งแบบมาตรฐาน (Standard Free Delivery) สำหรับทุกคำสั่งซื้อที่มียอดตั้งแต่ $100 ขึ้นไป และการจัดส่งด่วนพิเศษ (Express Delivery 1-2 วันทำการ) ในอัตราค่าบริการ $12.00'
      },
      {
        heading: '2. ระยะเวลาในการจัดเตรียมสินค้า',
        content: 'คำสั่งซื้อปกติจะได้รับการแพ็กและส่งมอบให้ผู้ให้บริการขนส่งภายใน 24-48 ชั่วโมงในวันทำการ หลังจากยืนยันการชำระเงินเรียบร้อย'
      },
      {
        heading: '3. การติดตามสถานะพัสดุ',
        content: 'ท่านสามารถตรวจสอบสถานะการจัดส่งได้ผ่านระบบ Tracking ในหน้าบัญชีส่วนตัว (Account Profile) หรือลิงก์ที่ระบุในอีเมลยืนยันการจัดส่ง'
      }
    ]
  },
  accessibility: {
    title: 'Accessibility Statement',
    titleTh: 'คำแถลงการเข้าถึงข้อมูลอย่างเท่าเทียม',
    icon: Eye,
    updated: 'January 10, 2026',
    sections: [
      {
        heading: '1. ความมุ่งมั่นของเรา',
        content: 'MatchA มุ่งมั่นพัฒนาแพลตฟอร์มดิจิทัลที่ทุกคนสามารถเข้าถึงและใช้งานได้อย่างสะดวกตามมาตรฐาน Web Content Accessibility Guidelines (WCAG 2.1 AA)'
      },
      {
        heading: '2. ฟังก์ชันอำนวยความสะดวก',
        content: 'เว็บไซต์รองรับการนำทางด้วยคีย์บอร์ด (Keyboard Navigation), การใช้คอนทราสต์ของสีที่อ่านง่าย และการระบุข้อความอธิบายภาพ (Alt text) บนสื่อทุกชิ้น'
      }
    ]
  }
};

export default function LegalPage() {
  const { topic = 'privacy' } = useParams();
  const { t, lang } = useLanguage();
  // /legal/anything used to show the Privacy Policy, so a mistyped or retired
  // policy link looked like it had worked. Only /legal itself means privacy.
  if (!Object.hasOwn(LEGAL_DOCS, topic)) return <NotFoundPage />;
  const docKey = topic;
  const doc = LEGAL_DOCS[docKey];
  const Icon = doc.icon;

  return (
    <div className="min-h-[85vh] bg-matcha-bg py-12 sm:py-16 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-matcha-text hover:text-matcha-accent transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{t('legalUi.back')}</span>
          </Link>
          <PreviewBadge label={t('legalUi.draftBadge')} />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-matcha-border pb-4">
          {Object.entries(LEGAL_DOCS).map(([key, item]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                docKey === key
                  ? 'bg-matcha-primary text-white font-bold shadow-xs'
                  : 'bg-white text-matcha-muted hover:bg-matcha-border/50 hover:text-black'
              }`}
            >
              {lang === 'th' ? item.titleTh : item.title}
            </Link>
          ))}
        </div>

        {/* Main Document Content */}
        <div className="bg-white border border-matcha-border rounded-3xl p-6 sm:p-10 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-matcha-secondary/15 text-matcha-primary flex items-center justify-center">
              <Icon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-matcha-text tracking-tight">
                {lang === 'th' ? doc.titleTh : doc.title}
              </h1>
              <p className="text-xs font-mono text-matcha-muted">
                {t('legalUi.effective', { date: doc.updated })}
              </p>
            </div>
          </div>

          <div className="h-px bg-matcha-border my-6" />

          {/* The policies are written in Thai; English readers are told so
              rather than handed a legal text nobody has reviewed in English. */}
          {lang === 'en' && (
            <p className="mb-6 text-xs font-mono text-matcha-muted">{t('legalUi.thaiOnly')}</p>
          )}

          <div className="space-y-6 text-sm text-[#333333] leading-relaxed">
            {doc.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h2 className="text-base font-bold text-matcha-text uppercase tracking-wide font-mono">
                  {sec.heading}
                </h2>
                <p className="text-xs sm:text-sm text-[#555555] font-sans leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-matcha-border text-center text-xs font-mono text-[#888888]">
            {t('legalUi.inquiries')} <a href="mailto:contact@matcha-archive.com" className="text-matcha-primary font-bold underline">contact@matcha-archive.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}
