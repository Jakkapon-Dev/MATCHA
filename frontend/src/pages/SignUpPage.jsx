import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import SignupForm from '../components/auth/SignUpForm';

export default function SignUpPage({ onBackToStore }) {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-[#FAF9F5] min-h-[90vh] py-8 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative selection:bg-[#042509] selection:text-white">
      
      {/* Subtle Ambient Background Wash */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#518F5C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#042509]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Canvas Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white border border-[#E5E2D8] rounded-[2rem] shadow-2xl shadow-[#042509]/5 overflow-hidden relative z-10"
      >
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Editorial Atelier Showcase (Desktop/Tablet) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-[#042509] text-[#FAF9F5] p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Textile Grid Motif */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#FAF9F5_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Top Brand Mark & Navigation */}
          <div className="relative z-10">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#FAF9F5]/70 hover:text-white transition-colors group mb-8"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>MatchA Boutique</span>
            </Link>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAF9F5]/10 border border-[#FAF9F5]/15 rounded-full text-[10px] font-mono tracking-widest uppercase text-[#518F5C]">
                <Sparkles size={11} className="text-[#518F5C]" />
                <span>MatchA Archive • Membership</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white leading-snug">
                Step into the Atelier Circle
              </h2>

              <p className="text-xs text-[#FAF9F5]/70 leading-relaxed font-sans font-light">
                {t('auth.atelierPledgeBody')}
              </p>
            </div>
          </div>

          {/* Member Privileges Highlights */}
          <div className="relative z-10 my-8 py-6 border-y border-[#FAF9F5]/10 space-y-3.5">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-[#518F5C]/20 border border-[#518F5C]/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-[#518F5C]">✦</span>
              </div>
              <span className="text-[#FAF9F5]/85">{t('auth.perkColor')}</span>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-[#518F5C]/20 border border-[#518F5C]/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-[#518F5C]">✦</span>
              </div>
              <span className="text-[#FAF9F5]/85">{t('auth.perkDrops')}</span>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-[#518F5C]/20 border border-[#518F5C]/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-[#518F5C]">✦</span>
              </div>
              <span className="text-[#FAF9F5]/85">{t('auth.perkTailoring')}</span>
            </div>
          </div>

          {/* Bottom Security / Trust Reassurance */}
          <div className="relative z-10 pt-2 flex items-center gap-2 text-[11px] font-mono text-[#FAF9F5]/60 border-t border-[#FAF9F5]/10">
            <ShieldCheck size={14} className="text-[#518F5C] shrink-0" />
            <span>{t('auth.protectedData')}</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Signup Registration Form                    */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          
          <div>
            {/* Header Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#042509] tracking-tight">
                  {t('auth.createAccount')}
                </h1>
                <span className="text-xs font-mono text-[#666666] hidden sm:inline-block">
                  Registration
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                {t('auth.signUpDesc')}
              </p>
            </div>

            {/* The Core Signup Form */}
            <SignupForm onBackToStore={onBackToStore} />
          </div>

        </div>

      </motion.div>

    </div>
  );
}