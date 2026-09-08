import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAF8F5] text-[#2D231E] py-16 px-6 md:px-12 border-t border-[#D9D3C7]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Frame 10 Header: Brand Name */}
        <div className="md:col-span-12 pb-6 border-b border-[#D9D3C7]">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#2D5A27] uppercase">
            MatchA
          </h2>
        </div>

        {/* Contact Info (Frame 10) */}
        <div className="md:col-span-4 space-y-2 text-xs text-[#6B5E55]">
          <h3 className="font-bold text-[#2D231E] text-sm uppercase tracking-wider mb-3">Contact</h3>
          <p className="font-mono">500 Terry Francine St</p>
          <p className="font-mono">San Francisco, CA 94158</p>
          <p className="font-mono pt-2">123-456-7890</p>
          <p className="font-mono text-[#BC5A36] font-semibold">info@matcha.com</p>
        </div>

        {/* Center Tagline Quote (Frame 10) */}
        <div className="md:col-span-4 text-xs text-[#2D231E] leading-relaxed max-w-xs">
          <h3 className="font-bold text-[#2D231E] text-sm uppercase tracking-wider mb-3">About Us</h3>
          <p className="font-medium italic">
            "A curated drop for city rebels and everyday legends 🍵👑"
          </p>
          <p className="text-[11px] text-[#6B5E55] mt-2">
            Every garment is crafted to celebrate personal expression, authentic style, and matcha culture.
          </p>
        </div>

        {/* Social & Legal Links (Frame 10) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-bold text-[#2D231E] text-sm uppercase tracking-wider mb-3">Follow</h3>
            <ul className="space-y-2 font-mono text-[#6B5E55]">
              <li><a href="#facebook" className="hover:text-[#2D5A27] transition-colors">Facebook</a></li>
              <li><a href="#instagram" className="hover:text-[#2D5A27] transition-colors">Instagram</a></li>
              <li><a href="#tiktok" className="hover:text-[#2D5A27] transition-colors">TikTok</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#2D231E] text-sm uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-1.5 font-mono text-[11px] text-[#6B5E55]">
              <li><a href="#privacy" className="hover:text-[#2D5A27] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#2D5A27] transition-colors">Terms & Conditions</a></li>
              <li><a href="#refund" className="hover:text-[#2D5A27] transition-colors">Refund Policy</a></li>
              <li><a href="#shipping" className="hover:text-[#2D5A27] transition-colors">Shipping Policy</a></li>
              <li><a href="#accessibility" className="hover:text-[#2D5A27] transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="md:col-span-12 pt-8 mt-4 border-t border-[#D9D3C7] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B5E55] font-mono">
          <p>© 2026 by MatchA. All rights reserved.</p>
          <p className="text-[#2D5A27] font-semibold mt-2 sm:mt-0">MatchA • Design System Active</p>
        </div>

      </div>
    </footer>
  );
}
