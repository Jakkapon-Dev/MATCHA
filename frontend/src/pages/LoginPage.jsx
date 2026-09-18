import React, { useState } from 'react';
import AtelierPanel from '../components/auth/AtelierPanel';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import PreviewBadge from '../components/ui/PreviewBadge';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  X,
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleDemoLogin = (role) => {
    const demoUser = role === 'Admin' ? {
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'admin@matcha.com',
      role: 'Admin',
      tier: 'System Admin',
      isDemoSession: true,
    } : {
      id: 'demo-member',
      name: 'Demo Member',
      email: 'demo@matcha.com',
      role: 'Member',
      tier: 'VIP Connoisseur',
      isDemoSession: true,
    };
    login(demoUser, false, 'demo-offline-token');
    showToast(`${t('auth.welcomeBack')}: ${demoUser.name} (${demoUser.role})`, 'success');
    if (onLoginSuccess) onLoginSuccess(demoUser);
    navigate(role === 'Admin' ? '/admin' : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg(t('auth.email') + ' / ' + t('auth.password'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      const account = res.data || {};
      const user = {
        id: account._id,
        name: account.name || email.split('@')[0],
        email: account.email,
        role: account.role || 'Member',
        tier: account.tier,
      };

      login(user, rememberMe, res.token);
      setSuccessMsg(`${t('auth.welcomeBack')}, ${user.name}! ✨`);

      if (onLoginSuccess) onLoginSuccess(user);

      navigate(user.role === 'Admin' ? '/admin' : '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.message && (err.message.includes('ติดต่อเซิร์ฟเวอร์ไม่ได้') || err.message.includes('Failed to communicate') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setErrorMsg('ตอนนี้เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง');
      } else {
        setErrorMsg(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReset = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setForgotModal(false);
      setForgotEmail('');
    }, 2200);
  };

  return (
    <div className="w-full bg-[#FAF9F5] min-h-[90vh] py-8 sm:py-16 px-5 sm:px-6 lg:px-8 flex items-center justify-center relative selection:bg-[#042509] selection:text-white">
      
      {/* Subtle Ambient Background Wash */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#518F5C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#042509]/5 rounded-full blur-3xl pointer-events-none" />

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
          title={t('auth.signInTitle')}
          footer={t('auth.archiveLine')}
        />

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Tactile Authentication Experience           */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          
          <div>
            {/* Header Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#042509] tracking-tight">
                  {t('auth.welcomeBack')}
                </h1>
                <span className="text-xs font-mono text-[#666666] hidden sm:inline-block">
                  MatchA ID
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                {t('auth.signInDesc')}
              </p>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2.5"
              >
                <AlertCircle size={15} className="text-[#C91D1D] shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3.5 rounded-xl bg-[#518F5C]/15 border border-[#518F5C]/40 text-[#042509] text-xs font-mono flex items-center gap-2.5"
              >
                <CheckCircle2 size={15} className="text-[#518F5C] shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Field */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509] mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#042509]">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-[11px] font-mono text-[#C91D1D] hover:underline cursor-pointer transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757B75]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-10 pr-11 py-3 bg-[#FAF9F5] border border-[#E5E2D8] rounded-xl text-xs sm:text-sm text-[#042509] placeholder-[#757B75]/60 focus:bg-white focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10 focus:outline-none transition-all font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#757B75] hover:text-[#042509] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs font-mono text-[#666666] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#DCDCDC] text-[#042509] focus:ring-[#042509] accent-[#042509] cursor-pointer"
                  />
                  <span>{t('auth.rememberMe')}</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 bg-[#042509] hover:bg-[#021505] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#042509]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('auth.signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.signInBtn')}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Social Authentication */}
            <div className="mt-6 pt-5 border-t border-[#E5E2D8]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#757B75]">
                  {t('auth.socialTitle')}
                </span>
                <PreviewBadge label="COMING SOON" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => showToast('Google Sign-In จะพร้อมใช้งานในเร็ว ๆ นี้', 'info')}
                  className="py-2.5 px-3 border border-[#E5E2D8] hover:border-[#042509]/40 rounded-xl text-xs font-mono font-medium text-[#042509] bg-[#FAF9F5] hover:bg-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>🌐</span>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('GitHub Sign-In จะพร้อมใช้งานในเร็ว ๆ นี้', 'info')}
                  className="py-2.5 px-3 border border-[#E5E2D8] hover:border-[#042509]/40 rounded-xl text-xs font-mono font-medium text-[#042509] bg-[#FAF9F5] hover:bg-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>GitHub</span>
                </button>
              </div>
            </div>

            {/* The demo bypass hands out a role without a password — including
                Admin, which then opens /admin. That is a reasonable convenience
                while developing and an open door in a deployed build, so it is
                compiled out of production rather than merely hidden. */}
            {import.meta.env.DEV && (
            <div className="mt-5 p-4 rounded-2xl bg-[#FBF8EF] border border-[#E8DFC8] text-[#5C4A28]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#4A3B1F]">
                  <span>{t('auth.demoModeTitle')}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E8DFC8]/60 text-[#4A3B1F] uppercase font-bold">
                  Bypass
                </span>
              </div>
              <p className="text-[11px] text-[#786645] mb-3 leading-relaxed">
                {t('auth.demoModeDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('Member')}
                  className="py-2 px-3 bg-white hover:bg-[#F3EDE0] border border-[#D9CBB0] rounded-xl text-xs font-mono font-bold text-[#4A3B1F] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <User size={13} className="text-[#518F5C]" />
                  <span>{t('auth.memberDemo')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('Admin')}
                  className="py-2 px-3 bg-[#042509] hover:bg-[#021505] text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <Shield size={13} className="text-[#518F5C]" />
                  <span>{t('auth.adminDemo')}</span>
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Switch to SignUp */}
          <div className="mt-6 pt-4 border-t border-[#E5E2D8] text-center text-xs font-mono text-[#666666]">
            <span>{t('auth.dontHaveAccount')} </span>
            <Link
              to="/signup"
              className="text-[#042509] font-bold underline hover:text-[#518F5C] transition-colors ml-1"
            >
              {t('auth.signUpHere')} →
            </Link>
          </div>

        </div>

      </motion.div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white border border-[#E5E2D8] rounded-2xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setForgotModal(false)}
              className="absolute top-4 right-4 text-[#757B75] hover:text-[#042509] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#042509]">
              <KeyRound size={20} className="text-[#518F5C]" />
              <h3 className="text-lg font-bold">{t('auth.resetTitle')}</h3>
            </div>
            <p className="text-xs text-[#666666] mb-4 font-sans">
              {t('auth.resetDesc')}
            </p>

            {forgotSent ? (
              <div className="p-3.5 rounded-xl bg-[#518F5C]/15 border border-[#518F5C]/40 text-[#042509] text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#518F5C] shrink-0" />
                <span>{t('auth.resetSent')}</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D8] text-xs font-sans focus:outline-none focus:border-[#042509] focus:ring-2 focus:ring-[#042509]/10"
                  required
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono border border-[#E5E2D8] text-[#666666] hover:bg-[#FAF9F5] cursor-pointer"
                  >
                    {t('auth.close')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#042509] hover:bg-[#021505] text-white cursor-pointer"
                  >
                    {t('auth.resetSend')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
