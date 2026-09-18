import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Truck, RotateCcw, Eye } from 'lucide-react';
import PreviewBadge from '../components/ui/PreviewBadge';

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    titleTh: 'นโยบายความเป็นส่วนตัว',
    icon: ShieldCheck,
    updated: 'January 15, 2026',
    sections: [
      {
        heading: '1. ข้อมูลที่เราจัดเก็บ',
        content: 'MatchA เคารพและให้ความสำคัญกับความเป็นส่วนตัวของคุณ เราจัดเก็บข้อมูลเฉพาะที่จำเป็นต่อการให้บริการ เช่น ชื่อ-นามสกุล อีเมล ที่อยู่สำหรับจัดส่งสินค้า และบันทึกคำสั่งซื้อ เพื่อใช้ในการประมวลผลคำสั่งซื้อและมอบประสบการณ์ที่ดีที่สุดแก่คุณ'
      },
      {
        heading: '2. การนำข้อมูลไปใช้',
        content: 'ข้อมูลส่วนบุคคลของคุณจะถูกใช้เพื่อการจัดส่งสินค้า การติดต่อประสานงาน และการแนะนำคอลเลกชันตามผลการวิเคราะห์ Personal Color Quiz เท่านั้น เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลของคุณให้แก่บุคคลภายนอกที่ไม่เกี่ยวข้อง'
      },
      {
        heading: '3. ความปลอดภัยของข้อมูล',
        content: 'เรารักษาความปลอดภัยของข้อมูลด้วยมาตรฐาน SSL 256-bit และการเข้ารหัสรหัสผ่านด้วยกระบวนการทางคณิตศาสตร์ชั้นสูง (Cryptographic Hashing) เพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต'
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
  const docKey = LEGAL_DOCS[topic] ? topic : 'privacy';
  const doc = LEGAL_DOCS[docKey];
  const Icon = doc.icon;

  return (
    <div className="min-h-[85vh] bg-[#F1F1F1] py-12 sm:py-16 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#000000] hover:text-[#C91D1D] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Store</span>
          </Link>
          <PreviewBadge label="OFFICIAL POLICY DRAFT" />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-[#DCDCDC] pb-4">
          {Object.entries(LEGAL_DOCS).map(([key, item]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                docKey === key
                  ? 'bg-[#042509] text-white font-bold shadow-xs'
                  : 'bg-white text-[#666666] hover:bg-[#DCDCDC]/50 hover:text-black'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* Main Document Content */}
        <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-10 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#518F5C]/15 text-[#042509] flex items-center justify-center">
              <Icon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-[#000000] tracking-tight">
                {doc.title}
              </h1>
              <p className="text-xs font-mono text-[#666666]">
                {doc.titleTh} • Effective Date: {doc.updated}
              </p>
            </div>
          </div>

          <div className="h-px bg-[#DCDCDC] my-6" />

          <div className="space-y-6 text-sm text-[#333333] leading-relaxed">
            {doc.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h2 className="text-base font-bold text-[#000000] uppercase tracking-wide font-mono">
                  {sec.heading}
                </h2>
                <p className="text-xs sm:text-sm text-[#555555] font-sans leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-[#DCDCDC] text-center text-xs font-mono text-[#888888]">
            For inquiries regarding our policies, reach out to <a href="mailto:contact@matcha-archive.com" className="text-[#042509] font-bold underline">contact@matcha-archive.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}
