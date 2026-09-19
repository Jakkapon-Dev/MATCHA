import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-matcha-text text-[#FFFFFF] py-16 px-6 md:px-12 border-t border-white/10">
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
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">{t('footer.contact')}</h3>
          <p className="font-mono">{t('footer.studio')}</p>
          <p className="font-mono">{t('footer.address')}</p>
          <p className="font-mono pt-2">+66 (0) 2 712 8899</p>
          <p className="font-mono text-matcha-bg font-semibold">contact@matcha-archive.com</p>
        </div>

        {/* Center Tagline Quote (Frame 10) */}
        <div className="md:col-span-4 text-xs text-[#CCCCCC] leading-relaxed max-w-xs">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">{t('footer.aboutUs')}</h3>
          <p className="font-medium italic">
            {t('footer.quote')}
          </p>
          <p className="text-[11px] text-[#888888] mt-2">
            {t('footer.about')}
          </p>
        </div>

        {/* Social & Legal Links (Frame 10) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">{t('footer.follow')}</h3>
            <ul className="space-y-2 font-mono text-[#999999]">
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-1.5 font-mono text-[11px] text-[#999999]">
              {/* Order history belongs somewhere a customer can come back to,
                  not only in the modal that shows once after checkout. It is
                  here rather than in the header because the header keeps one
                  button for a signed-out visitor on purpose. */}
              <li><Link to="/orders" className="hover:text-white transition-colors">{t('account.viewOrders')}</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/legal/refund" className="hover:text-white transition-colors">{t('footer.refund')}</Link></li>
              <li><Link to="/legal/shipping" className="hover:text-white transition-colors">{t('footer.shipping')}</Link></li>
              <li><Link to="/legal/accessibility" className="hover:text-white transition-colors">{t('footer.accessibility')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="md:col-span-12 pt-8 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#888888] font-mono">
          <p>{t('footer.copyright')}</p>
          {import.meta.env.DEV && (
            <p className="text-matcha-secondary font-semibold mt-2 sm:mt-0">{t('footer.designSystem')}</p>
          )}
        </div>

      </div>
    </footer>
  );
}
