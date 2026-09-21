import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import {
  Package,
  Heart,
  User,
  MapPin,
  CreditCard,
  Sliders,
  LogOut,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProfileTab from '../components/account/ProfileTab';
import OrdersTab from '../components/account/OrdersTab';
import FavoritesTab from '../components/account/FavoritesTab';
import AddressesTab from '../components/account/AddressesTab';
import PaymentMethodsTab from '../components/account/PaymentMethodsTab';
import PreferencesTab from '../components/account/PreferencesTab';
import LinkedAccountsTab from '../components/account/LinkedAccountsTab';
import { api } from '../services/api';
import { formatOrdersForDisplay } from '../utils/orderHistory';

export default function UserAccount() {
  const { t } = useLanguage();
  const { currentUser, updateProfile, uploadProfileAvatar, deleteProfileAvatar, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details');
  const accountMotionRef = useChangeMotion(activeTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [profile, setProfile] = useState({
    firstName: currentUser?.firstName || currentUser?.name?.split(' ')[0] || '',
    lastName: currentUser?.lastName || currentUser?.name?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatarUrl: currentUser?.avatarUrl || '',
  });

  const [preferences, setPreferences] = useState({
    vipAlerts: true,
    orderUpdates: true,
    newsletter: true,
    smsAlerts: false
  });

  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || prev.firstName,
        lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone ?? prev.phone,
        avatarUrl: currentUser.avatarUrl ?? prev.avatarUrl
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    api.getOrders()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          /* The server returns this account's orders and nothing else, so the
             filter that used to sit here is gone. It was never a safeguard:
             the endpoint sent every order in the shop and this ran in the
             browser, which meant the customer's own machine received other
             people's names, emails, phone numbers and addresses in order to
             discard them. Filtering where the data lives is the fix; this was
             only hiding it. */
          setOrders(formatOrdersForDisplay(res.data));
        }
        setOrdersLoaded(true);
      })
      .catch((err) => {
        console.warn('Order history fallback:', err.message);
        if (isMounted) setOrdersLoaded(true);
      });
    return () => { isMounted = false; };
  }, [currentUser]);

  const menuItems = [
    { id: 'details', label: 'PERSONAL DETAILS', icon: User },
    { id: 'products', label: 'ORDER HISTORY', icon: Package },
    { id: 'favorites', label: 'SAVED ARCHIVE', icon: Heart },
    { id: 'address', label: 'ADDRESS BOOK', icon: MapPin },
    { id: 'payment', label: 'PAYMENT METHODS', icon: CreditCard },
    { id: 'security', label: t('linkedAccounts.tabTitle') || 'LINKED ACCOUNTS', icon: ShieldCheck },
    { id: 'preferences', label: 'PREFERENCES', icon: Sliders },
    { id: 'logout', label: 'LOG OUT', icon: LogOut, isDanger: true }
  ];

  const handleTabClick = (tabId) => {
    if (tabId === 'logout') {
      setShowLogoutConfirm(true);
    } else {
      setActiveTab(tabId);
      setShowLogoutConfirm(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      showToast(err.message || 'Could not save profile.', 'error');
    }
  };

  const handlePreferenceToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast('Updated communication preference.');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setJustLoggedOut(true);
    logout();
    showToast(t('signedOut.toast'), 'info');
  };

  // If user is not logged in, display appropriate prompt based on whether they just logged out
  if (!currentUser) {
    if (justLoggedOut) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-matcha-bg">
          <div className="bg-white border border-matcha-border p-8 sm:p-12 max-w-md w-full text-center space-y-6">
            <div data-enter className="w-16 h-16 bg-matcha-secondary/20 text-matcha-primary flex items-center justify-center mx-auto text-2xl font-bold">
              
            </div>
            <div data-enter style={{ '--enter-delay': '70ms' }} className="space-y-2">
              <h1 className="text-2xl font-black uppercase text-[#0A0A0A]">{t('account.signedOut')}</h1>
              <p className="text-xs font-mono text-matcha-muted">
                {t('signedOut.done')}
              </p>
            </div>
            <div data-enter style={{ '--enter-delay': '190ms' }} className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-3 bg-[#0A0A0A] text-white text-xs font-bold font-mono uppercase hover:bg-black/80 transition-all cursor-pointer"
              >
                {t('signedOut.signInAgain')}
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 border border-matcha-border text-xs font-bold font-mono uppercase text-[#0A0A0A] hover:bg-matcha-bg transition-all cursor-pointer"
              >
                {t('signedOut.backToStore')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-matcha-bg">
        <div className="bg-white border border-matcha-border p-8 sm:p-12 max-w-md w-full text-center space-y-6">
          <div data-enter className="w-16 h-16 bg-[#0A0A0A] text-white flex items-center justify-center mx-auto">
            <User size={28} />
          </div>
          <div data-enter style={{ '--enter-delay': '70ms' }} className="space-y-2">
            <h1 className="text-2xl font-black uppercase text-[#0A0A0A]">{t('account.pleaseSignIn')}</h1>
            <p className="text-xs font-mono text-matcha-muted">
              {t('signedOut.lead')}
            </p>
          </div>
          <div data-enter style={{ '--enter-delay': '190ms' }} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: '/account' } })}
              className="flex-1 py-3 bg-[#0A0A0A] text-white text-xs font-bold font-mono uppercase hover:bg-black/80 transition-all cursor-pointer"
            >
              {t('signedOut.signInNow')}
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex-1 py-3 border border-matcha-border text-xs font-bold font-mono uppercase text-[#0A0A0A] hover:bg-matcha-bg transition-all cursor-pointer"
            >
              {t('signedOut.createAccount')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-matcha-bg min-h-screen py-10 sm:py-16 px-5 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        
        {/* Admin Quick Switch Banner if logged in user is Admin */}
        {currentUser?.role === 'Admin' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-matcha-primary text-white border border-matcha-primary-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-matcha-secondary" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-matcha-secondary">
                  Administrator Privilege Active
                </div>
                <div className="text-sm font-black">
                  You are currently viewing the customer Member Lounge
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-matcha-bg text-matcha-primary text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <span>{t('account.adminConsole')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-matcha-border">
          <div>
            <div data-enter className="flex items-center gap-2 text-xs font-mono font-bold text-matcha-primary uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>{t('account.lounge')}</span>
            </div>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-3xl sm:text-4xl font-black uppercase text-[#0A0A0A] tracking-tight">
              {t('account.title')}
            </h1>
          </div>

          {/* VIP Badge */}
          <div data-enter style={{ '--enter-delay': '190ms' }} className="flex items-center gap-2 px-3.5 py-1.5 bg-matcha-secondary text-matcha-primary font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-matcha-primary animate-pulse" />
            <span>
              {currentUser?.role === 'Admin' ? t('account.admin') : t('account.vip')}
            </span>
          </div>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2 bg-white border border-matcha-border p-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  data-enter style={{ '--enter-delay': `${Math.min(index * 45, 270)}ms` }}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    item.isDanger
                      ? 'text-matcha-accent hover:bg-matcha-accent/10'
                      : isActive
                      ? 'bg-matcha-primary text-white'
                      : 'text-matcha-muted hover:bg-matcha-bg hover:text-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="text-xs">✦</span>}
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div ref={accountMotionRef} className="lg:col-span-8">
            {activeTab === 'details' && (
              <ProfileTab
                profile={profile}
                onProfileChange={setProfile}
                onSave={handleProfileSave}
                saveSuccess={saveSuccess}
                onAvatarUpload={uploadProfileAvatar}
                onAvatarDelete={deleteProfileAvatar}
              />
            )}

            {activeTab === 'products' && <OrdersTab orders={orders} isLoaded={ordersLoaded} />}

            {activeTab === 'favorites' && <FavoritesTab />}

            {activeTab === 'address' && <AddressesTab />}

            {activeTab === 'payment' && <PaymentMethodsTab />}

            {activeTab === 'security' && <LinkedAccountsTab />}

            {activeTab === 'preferences' && (
              <PreferencesTab
                preferences={preferences}
                onTogglePreference={handlePreferenceToggle}
              />
            )}
          </div>

        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
            <div className="bg-white border border-matcha-border p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
              <h3 className="text-lg font-extrabold uppercase text-[#0A0A0A]">{t('account.signOutTitle')}</h3>
              <p className="text-xs font-mono text-matcha-muted">
                You can log back in anytime with your VIP credentials.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-matcha-border text-xs font-bold font-mono uppercase hover:bg-matcha-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-matcha-accent text-white text-xs font-bold font-mono uppercase hover:bg-matcha-accent-hover cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
