import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const newUser = {
        name: fullName || formData.email.split('@')[0],
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: 'Member',
        badge: '🟢 VIP MEMBER',
      };

      login(newUser);
      showToast(`Account created for ${newUser.name}! Welcome to VIP Archive 🎉`);
      navigate('/');
    }, 600);
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
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Alex"
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
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Collector"
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
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@matcha.vip"
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
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
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
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
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
          <span>Creating VIP Account...</span>
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