import React from 'react';
import AtelierPanel from '../components/auth/AtelierPanel';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import SignupForm from '../components/auth/SignUpForm';

export default function SignUpPage({ onBackToStore }) {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-[#FAF9F5] min-h-[90vh] py-8 sm:py-16 px-5 sm:px-6 lg:px-8 flex items-center justify-center relative selection:bg-[#042509] selection:text-white">
      
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
        <AtelierPanel
          title={t('auth.signUpTitle')}
          footer={t('auth.protectedData')}
        />

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