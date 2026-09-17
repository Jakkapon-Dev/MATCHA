import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#000000] text-[#FFFFFF] py-16 px-6 md:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Frame 10 Header: Brand Name (Official Brand Asset) */}
        <div className="md:col-span-12 pb-6 border-b border-white/15">
          <img 
            src="/images/brand/matcha-logo-white.png" 
            alt="MatchA Logo" 
            className="h-10 sm:h-12 w-auto object-contain mb-2" 
          />
        </div>

        {/* Contact Info (Frame 10) */}
        <div className="md:col-span-4 space-y-2 text-xs text-[#999999]">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Contact</h3>
          <p className="font-mono">500 Terry Francine St</p>
          <p className="font-mono">San Francisco, CA 94158</p>
          <p className="font-mono pt-2">123-456-7890</p>
          <p className="font-mono text-[#F1F1F1] font-semibold">info@matcha.com</p>
        </div>

        {/* Center Tagline Quote (Frame 10) */}
        <div className="md:col-span-4 text-xs text-[#CCCCCC] leading-relaxed max-w-xs">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">About Us</h3>
          <p className="font-medium italic">
            "A curated drop for city rebels and everyday legends 🍵👑"
          </p>
          <p className="text-[11px] text-[#888888] mt-2">
            Every garment is crafted to celebrate personal expression, authentic style, and matcha culture.
          </p>
        </div>

        {/* Social & Legal Links (Frame 10) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Follow</h3>
            <ul className="space-y-2 font-mono text-[#999999]">
              <li><a href="#facebook" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#instagram" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#tiktok" className="hover:text-white transition-colors">TikTok</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-1.5 font-mono text-[11px] text-[#999999]">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#refund" className="hover:text-white transition-colors">Refund Policy</a></li>
              <li><a href="#shipping" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="#accessibility" className="hover:text-white transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="md:col-span-12 pt-8 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#888888] font-mono">
          <p>© 2026 by MatchA. All rights reserved.</p>
          <p className="text-[#518F5C] font-semibold mt-2 sm:mt-0">MatchA • Design System Active</p>
        </div>

      </div>
    </footer>
  );
}
