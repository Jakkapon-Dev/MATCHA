import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, Shield, User, CheckCircle2, KeyRound } from 'lucide-react';

const DEMO_ACCOUNTS = {
  admin: {
    name: 'MatchA Admin',
    email: 'admin@matcha.vip',
    password: 'admin1234',
    role: 'Admin',
    badge: '👑 ADMIN',
  },
  member: {
    name: 'Alex Collector',
    email: 'member@matcha.vip',
    password: 'user1234',
    role: 'Member',
    badge: '🟢 VIP MEMBER',
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();

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

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      let userRole = 'Member';
      let userName = email.split('@')[0].replace(/[._-]/g, ' ') || 'MatchA Collector';

      if (email.toLowerCase().includes('admin')) {
        userRole = 'Admin';
        userName = 'MatchA Admin';
      }

      const user = {
        name: userName,
        email: email.trim(),
        role: userRole,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      };

      if (rememberMe) {
        localStorage.setItem('matcha_user', JSON.stringify(user));
      } else {
        sessionStorage.setItem('matcha_user', JSON.stringify(user));
      }

      setSuccessMsg(`Welcome back, ${user.name}! (${user.role}) ✨`);

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }

      setTimeout(() => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000);
    }, 850);
  };

  const handleFillDemo = (type) => {
    const acc = DEMO_ACCOUNTS[type];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.password);
      setErrorMsg('');
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
    }, 2000);
  };

  return (
    <div className="w-full bg-[#FAF8F5] py-12 sm:py-20 px-4 sm:px-6 md:px-8 min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#D0DEC6]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#BC5A36]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">

        {/* Brand Card Container */}
        <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#2D231E]/5 transition-all">
          
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2D231E] text-[#D0DEC6] text-[10px] font-mono font-bold tracking-widest uppercase rounded-full shadow-xs mb-3">
              <Sparkles size={11} className="text-[#BC5A36]" />
              <span>MatchA Collective • VIP Portal</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#2D231E] uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-[#6B5E55] mt-1.5 font-mono">
              Sign in to access your seasonal drops, orders & VIP perks.
            </p>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mb-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2D5A27] flex items-center gap-1">
                <KeyRound size={12} />
                Quick Demo Logins
              </span>
              <span className="text-[10px] font-mono text-[#6B5E55]">Click to auto-fill:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Admin Demo Button */}
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="p-2.5 rounded-xl border border-[#D9D3C7] hover:border-[#BC5A36] bg-white hover:bg-[#BC5A36]/5 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#BC5A36]">
                  <span>👑</span>
                  <span>Admin</span>
                </div>
                <p className="text-[10px] font-mono text-[#6B5E55] mt-0.5 truncate">admin@matcha.vip</p>
                <p className="text-[9px] font-mono text-[#2D231E]/60">pass: admin1234</p>
              </button>

              {/* Member Demo Button */}
              <button
                type="button"
                onClick={() => handleFillDemo('member')}
                className="p-2.5 rounded-xl border border-[#D9D3C7] hover:border-[#2D5A27] bg-white hover:bg-[#2D5A27]/5 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2D5A27]">
                  <span>👤</span>
                  <span>Member</span>
                </div>
                <p className="text-[10px] font-mono text-[#6B5E55] mt-0.5 truncate">member@matcha.vip</p>
                <p className="text-[9px] font-mono text-[#2D231E]/60">pass: user1234</p>
              </button>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
              <span className="shrink-0 text-red-500">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#D0DEC6]/50 border border-[#2D5A27]/30 text-[#2D5A27] text-xs font-mono flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#2D5A27] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B5E55]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-sm text-[#2D231E] placeholder-[#6B5E55]/60 focus:bg-white focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 focus:outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-mono text-[#BC5A36] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B5E55]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-sm text-[#2D231E] placeholder-[#6B5E55]/60 focus:bg-white focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20 focus:outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B5E55] hover:text-[#2D231E] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-mono text-[#2D231E] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D9D3C7] text-[#2D5A27] focus:ring-[#2D5A27] accent-[#2D5A27] cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#2D5A27]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to MatchA</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Social Login Dividers */}
          <div className="mt-6 pt-5 border-t border-[#D9D3C7] text-center">
            <span className="text-[10px] font-mono text-[#6B5E55] uppercase tracking-widest bg-white px-2 relative -top-7.5">
              or quick connect
            </span>

            <div className="grid grid-cols-2 gap-3 -mt-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('collector.google@matcha.vip');
                  setPassword('GoogleAuth2026');
                }}
                className="py-2.5 px-3 border border-[#D9D3C7] hover:border-[#2D5A27] rounded-xl text-xs font-mono font-bold text-[#2D231E] bg-[#FAF8F5] hover:bg-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>🌐</span>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('dev.collector@github.com');
                  setPassword('GitHubAuth2026');
                }}
                className="py-2.5 px-3 border border-[#D9D3C7] hover:border-[#2D5A27] rounded-xl text-xs font-mono font-bold text-[#2D231E] bg-[#FAF8F5] hover:bg-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>🐙</span>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {/* Switch to SignUp */}
          <div className="mt-6 text-center text-xs font-mono text-[#6B5E55]">
            Don't have a MatchA VIP ID?{' '}
            <Link
              to="/signup"
              className="font-bold text-[#BC5A36] hover:underline"
            >
              Create Account →
            </Link>
          </div>

        </div>

        {/* Security Assurance Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-[#6B5E55] uppercase tracking-widest">
          <ShieldCheck size={13} className="text-[#2D5A27]" />
          <span>256-bit SSL Encrypted • MatchA Secure Auth</span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative animate-scale-up">
            <h3 className="text-lg font-bold text-[#2D231E] uppercase tracking-tight">
              Reset Password
            </h3>
            <p className="text-xs text-[#6B5E55] mt-1 font-mono">
              Enter your email to receive a password reset link.
            </p>

            {forgotSent ? (
              <div className="mt-4 p-4 rounded-xl bg-[#D0DEC6]/50 text-[#2D5A27] text-xs font-mono font-bold text-center">
                ✓ Reset link sent to {forgotEmail}!
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27]"
                  required
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#D9D3C7] text-xs font-mono font-bold text-[#6B5E55] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#BC5A36] text-white text-xs font-mono font-bold hover:bg-[#9E4423] cursor-pointer"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
