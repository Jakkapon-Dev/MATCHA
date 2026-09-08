import React from 'react';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import SignupForm from '../components/auth/SignUpForm';

export default function SignUpPage({ onBackToStore }) {
  return (
    <div className="w-full bg-[#FAF8F5] py-12 sm:py-16 px-4 sm:px-6 md:px-8 min-h-[75vh] flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <span className="px-3 py-1 bg-[#2D231E] text-[#D0DEC6] text-[10px] font-mono font-bold tracking-widest uppercase rounded-lg shadow-2xs">
            MatchA VIP Archive • 2026
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2D231E] uppercase tracking-tight mt-2">
            Create Account
          </h1>
          <p className="text-xs text-[#6B5E55] mt-1.5 font-mono">
            Join the exclusive drop list & unlock early seasonal access.
          </p>
        </div>

        {/* The Core Signup Form Card */}
        <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <SignupForm onBackToStore={onBackToStore} />
        </div>

        {/* Micro Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono text-[#6B5E55]">
          <ShieldCheck size={14} className="text-[#2D5A27]" />
          <span>Encrypted & Protected MatchA Member Data</span>
        </div>

      </div>
    </div>
  );
}