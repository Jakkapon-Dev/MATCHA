import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProfileTab from '../components/account/ProfileTab';
import OrdersTab from '../components/account/OrdersTab';
import FavoritesTab from '../components/account/FavoritesTab';
import AddressesTab from '../components/account/AddressesTab';
import PaymentMethodsTab from '../components/account/PaymentMethodsTab';
import PreferencesTab from '../components/account/PreferencesTab';
import { api } from '../services/api';

export default function UserAccount() {
  const { currentUser, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details');
  const accountMotionRef = useChangeMotion(activeTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [profile, setProfile] = useState({
    firstName: currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'Alex',
    lastName: currentUser?.lastName || currentUser?.name?.split(' ').slice(1).join(' ') || 'Collector',
    email: currentUser?.email || 'alex@matcha.vip',
    phone: '081-999-8888',
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
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    api.getOrders()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          const userEmail = currentUser?.email?.toLowerCase();
          const userId = currentUser?._id || currentUser?.userId;
          const filtered = (userEmail || userId)
            ? res.data.filter(o => 
                (userEmail && o.customer?.email?.toLowerCase() === userEmail) ||
                (userId && String(o.userId) === String(userId))
              )
            : res.data;
          const displayList = filtered;
          const formatted = displayList.map((o) => ({
            id: o.orderId || o._id,
            date: o.createdAt
              ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Today',
            status: o.status || 'pending',
            paymentStatus: o.paymentStatus || 'unpaid',
            paymentMethod: o.paymentMethod || 'visa',
            total: Number(o.total) || 0,
            items: (o.items || []).map((i) => ({
              name: i.name || 'MatchA Garment',
              color: i.color || 'Default',
              size: i.size || '',
              qty: i.quantity || 1,
              price: i.price || 0,
              image: i.image || '/images/products/autumn/tops/shirts/color_1_brown.jpeg'
            }))
          }));
          setOrders(formatted);
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

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      email: profile.email
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePreferenceToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast('Updated communication preference.');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is logged out while on /account, display graceful prompt
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F1F1F1]">
        <div className="bg-white border border-[#DCDCDC] rounded-3xl p-8 sm:p-12 max-w-md w-full text-center space-y-6 shadow-xl">
          <div data-enter className="w-16 h-16 rounded-2xl bg-[#518F5C] text-[#042509] flex items-center justify-center mx-auto text-2xl font-bold">
            🍵
          </div>
          <div data-enter style={{ '--enter-delay': '70ms' }} className="space-y-2">
            <h1 className="text-2xl font-black uppercase text-[#000000]">Signed Out</h1>
            <p className="text-xs font-mono text-[#666666]">
              You have been successfully logged out of MatchA.
            </p>
          </div>
          <div data-enter style={{ '--enter-delay': '190ms' }} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-3 bg-[#042509] text-white text-xs font-bold font-mono uppercase rounded-xl shadow-md hover:bg-[#021505] transition-all cursor-pointer"
            >
              Sign In Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 border border-[#DCDCDC] text-xs font-bold font-mono uppercase text-[#000000] hover:bg-[#F1F1F1] rounded-xl transition-all cursor-pointer"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F1F1F1] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <main className="w-full max-w-7xl mx-auto space-y-8">
        
        {/* Admin Quick Switch Banner if logged in user is Admin */}
        {currentUser?.role === 'Admin' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-[#042509] text-white rounded-3xl shadow-md border border-[#021505]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-[#518F5C]" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#518F5C]">
                  Administrator Privilege Active
                </div>
                <div className="text-sm font-black">
                  You are currently viewing the customer Member Lounge
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F1F1F1] text-[#042509] text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 shrink-0"
            >
              <span>Open Admin Command Center</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DCDCDC]">
          <div>
            <div data-enter className="flex items-center gap-2 text-xs font-mono font-bold text-[#042509] uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>MatchA Collector Lounge</span>
            </div>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-3xl sm:text-4xl font-black uppercase text-[#000000] tracking-tight">
              Member Account
            </h1>
          </div>

          {/* VIP Badge */}
          <div data-enter style={{ '--enter-delay': '190ms' }} className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#518F5C] text-[#042509] font-mono text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#042509] animate-pulse" />
            <span>
              {currentUser?.role === 'Admin' ? '👑 STORE ADMINISTRATOR' : '🟢 MATCHA CONNOISSEUR (VIP)'}
            </span>
          </div>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2 bg-white border border-[#DCDCDC] rounded-3xl p-4 shadow-sm">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  data-enter style={{ '--enter-delay': `${Math.min(index * 45, 270)}ms` }}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    item.isDanger
                      ? 'text-[#C91D1D] hover:bg-[#C91D1D]/10'
                      : isActive
                      ? 'bg-[#042509] text-white shadow-xs'
                      : 'text-[#666666] hover:bg-[#F1F1F1] hover:text-[#000000]'
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
              />
            )}

            {activeTab === 'products' && <OrdersTab orders={orders} isLoaded={ordersLoaded} />}

            {activeTab === 'favorites' && <FavoritesTab />}

            {activeTab === 'address' && <AddressesTab />}

            {activeTab === 'payment' && <PaymentMethodsTab />}

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
            <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h3 className="text-lg font-extrabold uppercase text-[#000000]">Sign Out of MatchA?</h3>
              <p className="text-xs font-mono text-[#666666]">
                You can log back in anytime with your VIP credentials.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-[#DCDCDC] text-xs font-bold font-mono uppercase rounded-xl hover:bg-[#F1F1F1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-[#C91D1D] text-white text-xs font-bold font-mono uppercase rounded-xl shadow-md hover:bg-[#A81515] cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
