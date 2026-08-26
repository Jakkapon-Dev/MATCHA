import React, { useState, useEffect } from 'react';
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
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProfileTab from '../components/account/ProfileTab';
import OrdersTab from '../components/account/OrdersTab';
import FavoritesTab from '../components/account/FavoritesTab';
import AddressesTab from '../components/account/AddressesTab';
import PaymentMethodsTab from '../components/account/PaymentMethodsTab';
import PreferencesTab from '../components/account/PreferencesTab';
import AdminDashboardTab from '../components/account/AdminDashboardTab';

export default function UserAccount() {
  const { currentUser, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(currentUser?.role === 'Admin' ? 'admin' : 'details');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      if (currentUser.role === 'Admin') {
        setActiveTab('admin');
      }
    }
  }, [currentUser]);

  const menuItems = [
    { id: 'details', label: 'PERSONAL DETAILS', icon: User },
    { id: 'products', label: 'ORDER HISTORY', icon: Package },
    { id: 'favorites', label: 'SAVED ARCHIVE', icon: Heart },
    { id: 'address', label: 'ADDRESS BOOK', icon: MapPin },
    { id: 'payment', label: 'PAYMENT METHODS', icon: CreditCard },
    { id: 'preferences', label: 'PREFERENCES', icon: Sliders },
    { id: 'admin', label: 'ADMIN DASHBOARD & INVENTORY', icon: BarChart3, isAdminBadge: true },
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

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <main className="w-full max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#D9D3C7]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>MatchA Collector Lounge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#2D231E] tracking-tight">
              {currentUser?.role === 'Admin' ? 'Admin Control Center' : 'Member Account'}
            </h1>
          </div>

          {/* VIP / Admin Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D0DEC6] text-[#2D5A27] font-mono text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#2D5A27] animate-pulse" />
            <span>Role: {currentUser?.role === 'Admin' ? '👑 STORE ADMINISTRATOR' : '🟢 MATCH A CONNOISSEUR (VIP)'}</span>
          </div>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2 bg-white border border-[#D9D3C7] rounded-3xl p-4 shadow-sm">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    item.isDanger
                      ? 'text-[#BC5A36] hover:bg-[#BC5A36]/10'
                      : isActive
                      ? 'bg-[#2D5A27] text-white shadow-xs'
                      : item.isAdminBadge
                      ? 'text-[#2D5A27] bg-[#D0DEC6]/30 hover:bg-[#D0DEC6]/60'
                      : 'text-[#6B5E55] hover:bg-[#FAF8F5] hover:text-[#2D231E]'
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
          <div className="lg:col-span-8">
            {activeTab === 'details' && (
              <ProfileTab
                profile={profile}
                onProfileChange={setProfile}
                onSave={handleProfileSave}
                saveSuccess={saveSuccess}
              />
            )}

            {activeTab === 'products' && <OrdersTab />}

            {activeTab === 'favorites' && <FavoritesTab />}

            {activeTab === 'address' && <AddressesTab />}

            {activeTab === 'payment' && <PaymentMethodsTab />}

            {activeTab === 'preferences' && (
              <PreferencesTab
                preferences={preferences}
                onTogglePreference={handlePreferenceToggle}
              />
            )}

            {activeTab === 'admin' && <AdminDashboardTab />}
          </div>

        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h3 className="text-lg font-extrabold uppercase text-[#2D231E]">Sign Out of MatchA?</h3>
              <p className="text-xs font-mono text-[#6B5E55]">
                You can log back in anytime with your VIP credentials.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-[#D9D3C7] text-xs font-bold font-mono uppercase rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-3 bg-[#BC5A36] text-white text-xs font-bold font-mono uppercase rounded-xl shadow-md hover:bg-[#9E4423] cursor-pointer"
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