import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, Shield, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // The server decides who this is and what they may do; the browser is
      // told the answer, it does not work it out for itself.
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
      setSuccessMsg(`Welcome back, ${user.name}! (${user.role}) ✨`);

      if (onLoginSuccess) onLoginSuccess(user);

      navigate(user.role === 'Admin' ? '/admin' : '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message || 'Unable to sign in right now. Please try again.');
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
              <span>MatchA Collective</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#2D231E] uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-[#6B5E55] mt-1.5 font-mono">
              Sign in to see your seasonal drops and your orders.
            </p>
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
                  className="w-full pl-10 pr-4 py-3 bg-matcha-bg border border-matcha-border rounded-xl text-sm text-matcha-text placeholder-matcha-muted/60 focus:bg-white focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 focus:outline-none transition-all font-mono"
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
                  className="w-full pl-10 pr-11 py-3 bg-matcha-bg border border-matcha-border rounded-xl text-sm text-matcha-text placeholder-matcha-muted/60 focus:bg-white focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 focus:outline-none transition-all font-mono"
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
              className="w-full mt-3 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#2D5A27]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
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
              social sign-in — coming soon
            </span>

            <div className="grid grid-cols-2 gap-3 -mt-2">
              <button
                type="button"
                disabled
                title="Social sign-in is not implemented yet"
                className="py-2.5 px-3 border border-[#D9D3C7] rounded-xl text-xs font-mono font-bold text-[#2D231E]/40 bg-[#FAF8F5] flex items-center justify-center gap-2 cursor-not-allowed shadow-2xs"
              >
                <span>🌐</span>
                <span>Google</span>
              </button>

              <button
                type="button"
                disabled
                title="Social sign-in is not implemented yet"
                className="py-2.5 px-3 border border-[#D9D3C7] rounded-xl text-xs font-mono font-bold text-[#2D231E]/40 bg-[#FAF8F5] flex items-center justify-center gap-2 cursor-not-allowed shadow-2xs"
              >
                <span>🐙</span>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {/* Switch to SignUp */}
          <div className="mt-6 text-center text-xs font-mono text-[#6B5E55]">
            Don't have an account yet?{' '}
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
                  className="w-full px-3.5 py-2.5 bg-matcha-bg border border-matcha-border rounded-xl text-xs font-mono focus:outline-none focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary"
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
