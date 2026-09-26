import BackupTab from '../components/admin/BackupTab';
import MembersTab from '../components/admin/MembersTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import OrdersTab from '../components/admin/OrdersTab';
import InventoryTab from '../components/admin/InventoryTab';
import DashboardTab from '../components/admin/DashboardTab';
import CouponsTab from '../components/admin/CouponsTab';
import AdminNotificationsMenu from '../components/admin/AdminNotificationsMenu';
import AdminExportMenu from '../components/admin/AdminExportMenu';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { apiErrorText } from '../services/api';
import { Plus, BarChart3, Layers, Search, ExternalLink, ChevronRight, LayoutDashboard, Boxes, ClipboardList, UserCheck, HardDrive, LogOut, RefreshCw, MapPin, TicketPercent } from 'lucide-react';
import { webpSrc } from '../utils/imageFallback';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AddProductModal from '../components/admin/AddProductModal';
import OrderTrackingModal from '../components/admin/OrderTrackingModal';
import MediaManager from '../features/media/MediaManager';
import { api } from '../services/api';
import useChangeMotion from '../hooks/useChangeMotion';

import useAdminData from '../components/admin/useAdminData';

import { normalizeProduct } from '../components/admin/adminData';
import { formatCurrency } from '../utils/currency.js';

export default function AdminPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  // Active Tab View: 'media' | 'lookbook' | 'dashboard' | 'inventory' | 'orders' | 'analytics' | 'members' | 'coupons' | 'backup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const adminMotionRef = useChangeMotion(activeTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [restockSizes, setRestockSizes] = useState({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await api.getAdminNotifications();
      if (res?.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
      }
    } catch {
      // Quiet background polling
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkNotificationRead = async (notif) => {
    try {
      await api.markNotificationRead(notif.id || notif._id);
      setNotifications(prev => prev.map(n => (n.id || n._id) === (notif.id || notif._id) ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Fail quietly
    }
    const matched = orders.find(o => o.id === notif.orderNumber || o.id === notif.orderId || o.orderNumber === notif.orderNumber);
    if (matched) {
      setSelectedOrderForModal(matched);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Fail quietly
    }
  };

  const {
    inventory, setInventory,
    orders, setOrders,
    members, setMembers,
    stats,
    status, errors, refresh, pagination, changePage, fetchResource
  } = useAdminData(currentUser?.id || currentUser?._id);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [mutationNotice, setMutationNotice] = useState(null);
  const runMutation = async (action) => {
    if (savingRef.current || Object.values(status).includes('loading')) return false;
    savingRef.current = true;
    setSaving(true);
    setMutationNotice(null);
    try { await action(); setMutationNotice({ error: false, text: t('admin.saved') }); return true; }
    catch (error) { setMutationNotice({ error: true, text: apiErrorText(error, t) || t('errors.saveFailed') }); return false; }
    finally { savingRef.current = false; setSaving(false); }
  };
  /* Every dashboard figure below comes from the server's whole-collection
     aggregate, and from nowhere else.

     They used to be totalled from whatever the tables were holding — at most
     25 rows out of 75 garments — so "Active Stock Units", "Low Stock", the
     category split and the revenue chart all described one page and changed
     when the administrator turned it. There is deliberately no fallback to
     that arithmetic: the dashboard gates on `status.stats` and says it could
     not load rather than showing a number that is quietly wrong.

     `?? 0` is reached only while loading, before the gate lets anything
     render. */
  const monthlyData = useMemo(() => stats?.monthly ?? [], [stats]);
  // Global & Tab Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [memberTierFilter, setMemberTierFilter] = useState('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalSearch.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [globalSearch]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (activeTab === 'inventory') {
      fetchResource('inventory', { search: debouncedSearch, category: inventoryCategoryFilter, status: inventoryStatusFilter, page: 1 });
    } else if (activeTab === 'orders') {
      fetchResource('orders', { search: debouncedSearch, status: orderStatusFilter, page: 1 });
    } else if (activeTab === 'members') {
      fetchResource('members', { search: debouncedSearch, tier: memberTierFilter, page: 1 });
    }
  }, [debouncedSearch]);

  const handleInventoryCategoryChange = (cat) => {
    setInventoryCategoryFilter(cat);
    fetchResource('inventory', { category: cat, status: inventoryStatusFilter, search: debouncedSearch, page: 1 });
  };

  const handleInventoryStatusChange = (st) => {
    setInventoryStatusFilter(st);
    fetchResource('inventory', { category: inventoryCategoryFilter, status: st, search: debouncedSearch, page: 1 });
  };

  const handleOrderStatusChange = (st) => {
    setOrderStatusFilter(st);
    fetchResource('orders', { status: st, search: debouncedSearch, page: 1 });
  };

  const handleMemberTierChange = (tr) => {
    setMemberTierFilter(tr);
    fetchResource('members', { tier: tr, search: debouncedSearch, page: 1 });
  };

  const isDemo = Boolean(currentUser?.isDemoSession);

  // KPI Calculations
  const totalRevenue = stats?.paidRevenue ?? 0;
  const totalStockUnits = stats?.totalStockUnits ?? 0;
  const lowStockCount = stats?.lowStockCount ?? 0;
  const vipMembersCount = stats?.vipMembers ?? 0;
  const totalOrdersCount = stats?.totalOrders ?? 0;
  // The paid orders behind totalRevenue — the average order value divides by
  // these, not by every order including the ones still awaiting payment.
  const paidOrdersCount = stats?.paidOrders ?? 0;
  const totalProductsCount = stats?.totalProducts ?? 0;

  const categoryDistribution = useMemo(() => {
    const counts = {
      Tops: 0,
      Bottoms: 0,
      Outerwear: 0,
      Shoes: 0,
      Accessories: 0
    };

    for (const [name, count] of Object.entries(stats?.categories ?? {})) {
      if (counts[name] !== undefined) counts[name] = count;
    }

    const total = stats?.totalProducts ?? 0;

    return [
      {
        label: 'Tops & Knitwear',
        count: counts.Tops,
        percent: total > 0 ? Math.round((counts.Tops / total) * 100) : 0,
        color: '#042509'
      },
      {
        label: 'Bottoms & Denim',
        count: counts.Bottoms,
        percent: total > 0 ? Math.round((counts.Bottoms / total) * 100) : 0,
        color: '#C91D1D'
      },
      {
        label: 'Outerwear & Coats',
        count: counts.Outerwear,
        percent: total > 0 ? Math.round((counts.Outerwear / total) * 100) : 0,
        color: '#1A365D'
      },
      {
        label: 'Shoes & Footwear',
        count: counts.Shoes,
        percent: total > 0 ? Math.round((counts.Shoes / total) * 100) : 0,
        color: '#666666'
      },
      {
        label: 'Accessories & Bags',
        count: counts.Accessories,
        percent: total > 0 ? Math.round((counts.Accessories / total) * 100) : 0,
        color: '#D4A338'
      }
    ];
  }, [stats]);

  // Server-side filtered datasets (server filters and paginates directly)
  const filteredInventory = inventory;
  const filteredOrders = orders;
  const filteredMembers = members;

  // Change the screen only after persistence succeeds.
  const handleAddProduct = newProduct => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const result = await api.createProduct({ ...newProduct, quantity: Number(newProduct.stock), price: Number(newProduct.price) });
    if (!result?.success || !result.data) throw new Error('Product was not saved');
    setInventory(previous => [normalizeProduct(result.data), ...previous]);
    showToast('Product saved', 'success');
  });

  /* Restocking sends the change, not a new total, and names a size when the
     garment has any.

     It used to compute `stock + amount` and PUT that as the whole product's
     total. For the 75 garments that track stock per size that total is only
     the sum of the size buckets: the number moved on screen, no bucket moved
     with it, orders kept drawing on the old per-size figures and the next full
     save recomputed the total straight back down. */
  const handleRestock = (id, amount, size) => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const item = inventory.find(product => product.id === id);
    if (!item) return;
    const result = await api.restockProduct(id, { delta: amount, size: size || undefined });
    if (!result?.success || !result.data) throw new Error(result?.message || 'Stock was not saved');
    setInventory(previous => previous.map(product => product.id === id ? normalizeProduct(result.data) : product));
    showToast(size ? `Stock saved (size ${size})` : 'Stock saved', 'success');
  });

  /* A leading minus survives, so stock can still be taken away. The buttons
     this box replaced were +10 and -5; stripping every non-digit kept the
     adding and quietly lost the removing, with handleRestock still able to do
     it and nothing left that could ask. */
  const handleRestockInputChange = (id, val) => {
    const sign = val.trim().startsWith('-') ? '-' : '';
    const digits = val.replace(/\D/g, '');
    setRestockAmounts(prev => ({ ...prev, [id]: digits ? sign + digits : sign }));
  };

  /* Which size each row's adjustment applies to. A garment with size buckets
     has no meaningful "total" to add to, so the row cannot be submitted until
     one is picked. */
  const handleRestockSizeChange = (id, size) => {
    setRestockSizes(prev => ({ ...prev, [id]: size }));
  };

  const handleRestockSubmit = async (id) => {
    const amount = parseInt(restockAmounts[id], 10);
    if (!Number.isFinite(amount) || amount === 0) return;
    const item = inventory.find(product => product.id === id);
    const needsSize = Boolean(item?.needsSizeChoice);
    const size = needsSize ? restockSizes[id] : '';
    if (needsSize && !size) {
      showToast('Choose which size to restock', 'error');
      return;
    }
    if (await handleRestock(id, amount, size)) setRestockAmounts(prev => ({ ...prev, [id]: '' }));
  };

  const handleDeleteProduct = id => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const result = await api.deleteProduct(id);
    if (!result?.success) throw new Error('Product was not deleted');
    setInventory(previous => previous.filter(product => product.id !== id));
    showToast('Product deleted', 'success');
  });

  const handleUpdateOrderStatus = (orderId, newStatus) => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const result = await api.updateOrderStatus(orderId, { status: newStatus.toLowerCase() });
    if (!result?.success) throw new Error('Order status was not saved');
    setOrders(previous => previous.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    setSelectedOrderForModal(previous => previous?.id === orderId ? { ...previous, status: newStatus } : previous);
    showToast('Order status saved', 'success');
  });

  const handleToggleVIPTier = memberId => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const member = members.find(item => item.id === memberId);
    const tier = member.tier.includes('VIP') ? 'Regular Member' : 'VIP Connoisseur';
    const result = await api.updateUser(memberId, { tier });
    if (!result?.success || !result.data) throw new Error('Membership tier was not saved');
    setMembers(previous => previous.map(item => item.id === memberId ? { ...item, tier: result.data.tier } : item));
    showToast('Membership tier saved', 'success');
  });

  // Export File Helper
  const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
    if (saving || Object.values(status).some(value => value !== 'ready')) { showToast('Load all data before exporting', 'warning'); return; }
    const bom = type.includes('csv') ? '\uFEFF' : '';
    const blob = new Blob([bom + content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename} successfully!`, 'success');
    setIsExportMenuOpen(false);
  };

  const handleExportInventory = () => {
    const headers = ['SKU ID,Product Name,Category,Price ($),Stock,Status,Color,Fit,Season,Created Date'];
    const rows = inventory.map(item =>
      `"${item.id}","${item.name.replace(/"/g, '""')}","${item.category}",${item.price},${item.stock},"${item.status}","${item.color}","${item.fit}","${item.season}","${item.createdAt}"`
    );
    downloadFile([headers, ...rows].join('\n'), `MatchA_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportOrders = () => {
    const headers = ['Order ID,Customer Name,Email,Items Count,Total Amount ($),Fulfillment Status,Order Date'];
    const rows = orders.map(ord =>
      `"${ord.id}","${ord.customer.replace(/"/g, '""')}","${ord.email}",${ord.items},${ord.total},"${ord.status}","${ord.date}"`
    );
    downloadFile([headers, ...rows].join('\n'), `MatchA_Orders_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportFullJSON = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      store: 'MatchA Artisan Apparel',
      kpis: { totalRevenue, totalOrders: totalOrdersCount, totalStockUnits, lowStockCount, vipMembersCount },
      inventory,
      orders,
      members,
      monthlyRevenue: monthlyData
    };
    downloadFile(JSON.stringify(backupData, null, 2), `MatchA_Full_Store_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Nav Items
  const navTabs = [
    { id: 'media', label: t('admin.tabMedia'), icon: Layers, badge: null },
    { id: 'lookbook', label: 'Lookbook Hotspots', icon: MapPin, badge: null },
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    /* Each badge counts what its label names, across the whole shop.

       They used to count the page: `inventory.length` is the 25 rows loaded,
       not the 75 garments, and the orders badge filtered those same loaded
       rows for `Processing`. So the menu read "Inventory & Stock 25" beside a
       table saying "page 1 of 3", and "Orders Pipeline 1" beside 20 orders —
       numbers that moved when an administrator turned a page. The totals come
       from GET /admin/stats, which describes the shop rather than the view. */
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, badge: totalProductsCount },
    { id: 'orders', label: 'Orders Pipeline', icon: ClipboardList, badge: totalOrdersCount },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3, badge: null },
    { id: 'members', label: 'VIP Customer Registry', icon: UserCheck, badge: vipMembersCount },
    { id: 'coupons', label: 'Coupons', icon: TicketPercent, badge: null },
    { id: 'backup', label: 'Reports & Backups', icon: HardDrive, badge: null }
  ];

  return (
    <div className="min-h-screen bg-matcha-bg text-matcha-text flex flex-col md:flex-row">
      
      {/* ========================================================================= */}
      {/* 1. LEFT DASHBOARD NAVIGATION SIDEBAR                                      */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-64 lg:w-72 bg-matcha-text text-white flex flex-col shrink-0 border-r border-[#3E322C] select-none">
        
        {/* Brand Header — the shop's own mark, not a status light. The green
            dot that sat here pulsed whatever the data was doing, so it read
            as "online" even while every table was failing to load; loading
            and failure are already shown where the data is. */}
        <div className="px-5 py-5 md:px-6 md:py-6 border-b border-[#3E322C]">
          <div className="flex items-center gap-3">
            <img
              src={webpSrc('/images/brand/matcha-icon.png')} data-original-src="/images/brand/matcha-icon.png"
              alt=""
              aria-hidden="true"
              className="w-9 h-9 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 leading-tight">
              <span className="block font-sans text-base font-extrabold uppercase tracking-[0.12em] text-white">MatchA</span>
              <span className="block text-[11px] font-mono text-[#A89F91]">Admin Console</span>
            </div>
          </div>
        </div>

        {/* Current Admin Identity Card */}
        <div className="hidden md:flex p-4 mx-4 mt-4 rounded-xl bg-[#3A2E28] border border-[#4D3E35] items-center justify-between gap-2 text-xs font-mono">
          <div className="truncate">
            <div className="text-[10px] text-matcha-secondary uppercase">Active Operator</div>
            <div className="font-bold text-white truncate">{currentUser?.name || 'Administrator'}</div>
          </div>
          <span className="px-2 py-0.5 rounded bg-matcha-accent text-white text-[10px] font-bold">
            {currentUser?.role || 'Admin'}
          </span>
        </div>

        {/* Navigation Tab Links */}
        <nav aria-label="Admin sections" className="md:flex-1 p-3 md:p-4 flex md:block gap-1 md:space-y-1 overflow-x-auto [scrollbar-width:thin] md:overflow-x-visible md:overflow-y-auto">
          <div className="hidden md:block text-[10px] font-mono font-bold uppercase text-[#A89F91] px-3 py-2 tracking-wider">
            Management Modules
          </div>

          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setGlobalSearch('');
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 md:w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-matcha-primary text-white shadow-md md:translate-x-1'
                    : 'text-matcha-border hover:bg-[#3A2E28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-matcha-secondary' : 'text-[#A89F91]'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-matcha-accent text-white' : 'bg-[#4D3E35] text-matcha-secondary'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Actions */}
        <div className="p-3 md:p-4 border-t border-[#3E322C] grid grid-cols-2 md:grid-cols-1 gap-2 font-mono text-xs">
          <button
            onClick={() => navigate('/catalog')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap bg-[#3A2E28] hover:bg-[#4D3E35] text-matcha-secondary transition-colors cursor-pointer"
          >
            <ExternalLink size={13} />
            <span>Visit Live Storefront</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
              showToast('Logged out of Admin Session', 'info');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-matcha-accent hover:bg-matcha-accent/10 transition-colors cursor-pointer font-bold"
          >
            <LogOut size={13} />
            <span>End Session</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD CONTENT CANVAS                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {isDemo && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-6 py-2.5 text-xs font-mono font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <span>{t('admin.demoNotice')}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-400 font-extrabold w-fit">
              READ-ONLY DEMO
            </span>
          </div>
        )}

        {/* Top Header Bar with Universal Search & Action Buttons */}
        <header className="sticky top-0 z-20 bg-matcha-bg/90 backdrop-blur-md border-b border-matcha-border px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 xl:gap-6">
          
          {/* Breadcrumb & Tab Title */}
          <div>
            <h1 className="sr-only">Admin Control Center</h1>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-matcha-muted">
              <span>Admin</span>
              <ChevronRight size={11} aria-hidden="true" />
              <span className="text-matcha-primary font-bold">{navTabs.find(tab => tab.id === activeTab)?.label}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-matcha-text">
              {navTabs.find(tab => tab.id === activeTab)?.label}
            </h2>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Global Search Input */}
            <div className="relative basis-full sm:basis-auto sm:flex-1 xl:flex-none xl:w-72">
              <Search size={14} className="absolute left-3 inset-y-0 my-auto text-matcha-muted" aria-hidden="true" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search metrics, SKU, orders, members..."
                aria-label="Search metrics, SKU, orders, members"
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-matcha-border bg-white font-mono text-xs text-matcha-text outline-none focus:ring-2 focus:ring-matcha-primary/40"
              />
              {globalSearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 inset-y-0 my-auto h-fit text-xs text-matcha-accent hover:font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Refresh — reloads every admin table and the dashboard aggregate */}
            <button
              type="button"
              disabled={saving || Object.values(status).includes('loading')}
              onClick={() => { setSelectedOrderForModal(null); setMutationNotice(null); refresh(); }}
              className="h-9 px-3 rounded-xl bg-white border border-matcha-border hover:border-matcha-primary text-matcha-text font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary"
            >
              <RefreshCw size={13} className={Object.values(status).includes('loading') ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh data</span>
            </button>

            {/* Notifications Bell */}
            <AdminNotificationsMenu
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={isNotifMenuOpen}
              onToggle={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              onClose={() => setIsNotifMenuOpen(false)}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            />

            {/* Export Dropdown */}
            <AdminExportMenu
              isOpen={isExportMenuOpen}
              onToggle={() => setIsExportMenuOpen(!isExportMenuOpen)}
              onClose={() => setIsExportMenuOpen(false)}
              onExportInventory={handleExportInventory}
              onExportOrders={handleExportOrders}
              onExportFullJSON={handleExportFullJSON}
            />


            {/* Quick Add Product Button */}
            <button
              onClick={() => { setMutationNotice(null); setIsAddModalOpen(true); }} disabled={saving || isDemo || status.inventory !== 'ready'}
              className="h-9 px-4 bg-matcha-primary hover:bg-matcha-primary-dark text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-matcha-primary"
            >
              <Plus size={14} />
              <span>Add Garment</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body Area */}
        <div ref={adminMotionRef} className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & KPIS (EXECUTIVE DASHBOARD)                              */}
          {/* ========================================================================= */}
          {(saving || mutationNotice) && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              {saving && <span role="status">Saving changes…</span>}
              {mutationNotice && <p role={mutationNotice.error ? 'alert' : 'status'} className={mutationNotice.error ? 'text-red-800' : 'text-green-900'}>{mutationNotice.error && `${t('errors.saveFailed')}: `}{mutationNotice.text}</p>}
            </div>
          )}
          {activeTab === 'media' && <MediaManager key="media" />}
          {activeTab === 'lookbook' && <MediaManager key="lookbook" initialTab="looks" />}
          {activeTab === 'dashboard' && (
            <DashboardTab status={status} errors={errors} totalRevenue={totalRevenue} orders={orders} totalOrdersCount={totalOrdersCount} paidOrdersCount={paidOrdersCount} orderStatus={stats?.orderStatus ?? null} totalStockUnits={totalStockUnits} totalProductsCount={totalProductsCount} vipMembersCount={vipMembersCount} lowStockCount={lowStockCount} monthlyData={monthlyData} categoryDistribution={categoryDistribution} setActiveTab={setActiveTab} />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INVENTORY & STOCK MANAGEMENT                                       */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <InventoryTab
              status={status}
              errors={errors}
              setInventoryCategoryFilter={handleInventoryCategoryChange}
              inventoryCategoryFilter={inventoryCategoryFilter}
              inventoryStatusFilter={inventoryStatusFilter}
              setInventoryStatusFilter={handleInventoryStatusChange}
              filteredInventory={filteredInventory}
              restockAmounts={restockAmounts}
              restockSizes={restockSizes}
              handleRestockSizeChange={handleRestockSizeChange}
              handleRestockInputChange={handleRestockInputChange}
              handleRestockSubmit={handleRestockSubmit}
              saving={saving}
              isDemo={isDemo}
              handleDeleteProduct={handleDeleteProduct}
              pagination={pagination?.inventory}
              onPageChange={(p) => changePage('inventory', p)}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ORDERS PIPELINE                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <OrdersTab
              status={status}
              errors={errors}
              setOrderStatusFilter={handleOrderStatusChange}
              orderStatusFilter={orderStatusFilter}
              filteredOrders={filteredOrders}
              setSelectedOrderForModal={order => { setMutationNotice(null); setSelectedOrderForModal(order); }}
              saving={saving}
              isDemo={isDemo}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              pagination={pagination?.orders}
              onPageChange={(p) => changePage('orders', p)}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REVENUE ANALYTICS                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <AnalyticsTab status={status} errors={errors} totalRevenue={totalRevenue} monthlyData={monthlyData} />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: VIP CUSTOMER REGISTRY                                              */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <MembersTab
              status={status}
              errors={errors}
              setMemberTierFilter={handleMemberTierChange}
              memberTierFilter={memberTierFilter}
              filteredMembers={filteredMembers}
              handleToggleVIPTier={handleToggleVIPTier}
              saving={saving}
              isDemo={isDemo}
              pagination={pagination?.members}
              onPageChange={(p) => changePage('members', p)}
            />
          )}

          {activeTab === 'coupons' && <CouponsTab search={debouncedSearch} isDemo={isDemo} />}

          {/* ========================================================================= */}
          {/* TAB 6: REPORTS & SYSTEM BACKUPS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'backup' && (
            <BackupTab status={status} errors={errors} handleExportFullJSON={handleExportFullJSON} handleExportInventory={handleExportInventory} handleExportOrders={handleExportOrders} />
          )}

        </div>

      </div>

      {/* Add Product Modal */}
      <AddProductModal
        saveError={mutationNotice?.error ? mutationNotice.text : null}
        saving={saving}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Order Tracking & Fulfillment Details Modal */}
      <OrderTrackingModal
        saveError={mutationNotice?.error ? mutationNotice.text : null}
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        order={selectedOrderForModal}
        onUpdateStatus={handleUpdateOrderStatus}
      />

    </div>
  );
}
