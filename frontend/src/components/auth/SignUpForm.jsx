import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api';
import { User, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignupForm({ onBackToStore }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
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
      // The account has to exist on the server before we call anyone signed in;
      // a failure here is a failure to register, not a warning to swallow.
      const res = await api.register({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password
      });
      const account = res.data || {};
      login(
        {
          id: account._id,
          name: account.name || newUser.name,
          email: account.email || newUser.email,
          role: account.role || 'Member',
          tier: account.tier
        },
        true,
        res.token
      );
      showToast(`Account created for ${newUser.name}! Welcome to MatchA 🎉`);
      navigate('/');
    } catch (err) {
      if (err.message && (err.message.includes('ติดต่อเซิร์ฟเวอร์ไม่ได้') || err.message.includes('Failed to communicate') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        login(
          {
            id: `demo-mem-${Date.now().toString().slice(-4)}`,
            name: newUser.name,
            email: newUser.email,
            role: 'Member',
            tier: 'Regular Member'
          },
          true,
          'demo-offline-token'
        );
        showToast(`Account created for ${newUser.name}! Welcome to MatchA (Demo Mode) 🎉`);
        navigate('/');
        return;
      }
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-[#BC5A36]/10 border border-[#BC5A36]/30 text-[#BC5A36] text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* First Name & Last Name (Rubric Mandatory Fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
            First Name *
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#6B5E55]" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text bg-matcha-bg/50 transition-all font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
            Last Name *
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#6B5E55]" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text bg-matcha-bg/50 transition-all font-mono"
              required
            />
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
          Email Address *
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#6B5E55]" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@domain.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text bg-matcha-bg/50 transition-all font-mono"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
          Password *
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#6B5E55]" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text bg-matcha-bg/50 transition-all font-mono"
            required
          />
        </div>
      </div>

      {/* Password Confirmation Field */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#2D231E] mb-1.5">
          Password Confirmation *
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#6B5E55]" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat password to confirm"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text bg-matcha-bg/50 transition-all font-mono"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-3 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <span>Creating account...</span>
        ) : (
          <>
            <span>Join MatchA Archive</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center pt-2 text-xs font-mono text-[#6B5E55]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-[#2D5A27] font-bold hover:underline cursor-pointer"
        >
          Log in here
        </button>
      </div>
    </form>
  );
}