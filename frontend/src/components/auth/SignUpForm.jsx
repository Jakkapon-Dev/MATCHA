import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SignupForm({ onBackToStore }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Password validation checks
  const isLengthValid = formData.password.length >= 8;
  const isMatchValid = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLengthValid) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร (At least 8 characters required)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน (Passwords do not match)');
      return;
    }

    setIsLoading(true);

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const newUser = {
      name: fullName || formData.email.split('@')[0],
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: 'Member',
    };

    try {
      const res = await api.register({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
      });
      const account = res.data || {};
      
      login(
        {
          id: account._id,
          name: account.name || newUser.name,
          email: account.email || newUser.email,
          role: account.role || 'Member',
          tier: account.tier,
        },
        true,
        res.token
      );

      showToast(`ยินดีต้อนรับสู่ MatchA Collective, ${newUser.name}! ✨`, 'success');
      navigate('/');
    } catch (err) {
      if (err.message && (err.message.includes('ติดต่อเซิร์ฟเวอร์ไม่ได้') || err.message.includes('Failed to communicate') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('ตอนนี้เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง');
      } else {
        setError(err.message || 'ไม่สามารถสร้างบัญชีได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Banner */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2.5"
        >
          <AlertCircle size={15} className="text-[#C91D1D] shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* First & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
            {t('auth.firstName')} *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
              <User size={15} />
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={t('auth.firstNamePlaceholder')}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
            {t('auth.lastName')} *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
              <User size={15} />
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={t('auth.lastNamePlaceholder')}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
              required
            />
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
          {t('auth.email')} *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
            <Mail size={15} />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('auth.emailPlaceholder')}
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
          {t('auth.password')} *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
            <Lock size={15} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('auth.passwordPlaceholder')}
            className="w-full pl-9 pr-10 py-2.5 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#757B75] hover:text-[#042509] cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
          {t('auth.confirmPassword')} *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
            <Lock size={15} />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            className="w-full pl-9 pr-10 py-2.5 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#757B75] hover:text-[#042509] cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Micro Password Requirements Feedback */}
      {formData.password && (
        <div className="py-1 px-2 space-y-1 text-[11px] font-mono">
          <div className={`flex items-center gap-1.5 transition-colors ${isLengthValid ? 'text-[#518F5C]' : 'text-[#757B75]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isLengthValid ? 'bg-[#518F5C]/20 text-[#518F5C]' : 'bg-[#E5E2D8] text-[#757B75]'}`}>
              {isLengthValid ? '✓' : '•'}
            </span>
            <span>ความยาวอย่างน้อย 8 ตัวอักษร (Minimum 8 characters)</span>
          </div>

          {formData.confirmPassword && (
            <div className={`flex items-center gap-1.5 transition-colors ${isMatchValid ? 'text-[#518F5C]' : 'text-[#C91D1D]'}`}>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isMatchValid ? 'bg-[#518F5C]/20 text-[#518F5C]' : 'bg-red-100 text-[#C91D1D]'}`}>
                {isMatchValid ? '✓' : '✕'}
              </span>
              <span>{isMatchValid ? 'รหัสผ่านตรงกัน (Passwords match)' : 'รหัสผ่านยังไม่ตรงกัน (Passwords do not match)'}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-3 py-3.5 bg-[#042509] hover:bg-[#021505] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#042509]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t('auth.signingUp')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.signUpBtn')}</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center pt-3 border-t border-[#E5E2D8] text-xs font-mono text-[#666666]">
        <span>{t('auth.alreadyHaveAccount')} </span>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-[#042509] font-bold underline hover:text-[#518F5C] cursor-pointer ml-1"
        >
          {t('auth.signInHere')} →
        </button>
      </div>
    </form>
  );
}
