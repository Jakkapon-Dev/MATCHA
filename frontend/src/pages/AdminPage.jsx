import BackupTab from '../components/admin/BackupTab';
import MembersTab from '../components/admin/MembersTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import OrdersTab from '../components/admin/OrdersTab';
import InventoryTab from '../components/admin/InventoryTab';
import DashboardTab from '../components/admin/DashboardTab';
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Layers, Search, ExternalLink, ChevronRight, Download, FileSpreadsheet, FileJson, ChevronDown, LayoutDashboard, Boxes, ClipboardList, UserCheck, HardDrive, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AddProductModal from '../components/admin/AddProductModal';
import OrderTrackingModal from '../components/admin/OrderTrackingModal';
import MediaManager from '../features/media/MediaManager';
import { api } from '../services/api';
import useChangeMotion from '../hooks/useChangeMotion';

import useAdminData from '../components/admin/useAdminData';

import { normalizeProduct, monthlyRevenue } from '../components/admin/adminData';

export default function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  // Active Tab View: 'dashboard' | 'inventory' | 'orders' | 'analytics' | 'members' | 'backup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const adminMotionRef = useChangeMotion(activeTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const { inventory, setInventory, orders, setOrders, members, setMembers, status, errors, refresh } = useAdminData(currentUser?.id || currentUser?._id);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [mutationNotice, setMutationNotice] = useState(null);
  const runMutation = async (action) => {
    if (savingRef.current || Object.values(status).includes('loading')) return false;
    savingRef.current = true;
    setSaving(true);
    setMutationNotice(null);
    try { await action(); setMutationNotice({ error: false, text: 'บันทึกสำเร็จ / Changes saved' }); return true; }
    catch (error) { setMutationNotice({ error: true, text: error.message || 'Could not save changes' }); return false; }
    finally { savingRef.current = false; setSaving(false); }
  };
  const monthlyData = useMemo(() => monthlyRevenue(orders), [orders]);
  // Global & Tab Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [memberTierFilter, setMemberTierFilter] = useState('ALL');

  const isDemo = Boolean(currentUser?.isDemoSession);

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.status !== 'Cancelled' && ord.paymentStatus === 'Paid' ? ord.total : 0), 0);
  }, [orders]);

  const totalStockUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.stock, 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(item => item.stock <= 10).length;
  }, [inventory]);

  const vipMembersCount = useMemo(() => {
    return members.filter(m => m.tier.includes('VIP')).length;
  }, [members]);

  const categoryDistribution = useMemo(() => {
    const total = inventory.length;
    const counts = {
      Tops: 0,
      Bottoms: 0,
      Outerwear: 0,
      Shoes: 0,
      Accessories: 0
    };

    inventory.forEach(item => {
      if (item.category && counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

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
  }, [inventory]);

  // Filtered Datasets
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = globalSearch === '' || 
        item.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.color.toLowerCase().includes(globalSearch.toLowerCase());
      const matchCat = inventoryCategoryFilter === 'ALL' || item.category === inventoryCategoryFilter;
      const matchStatus = inventoryStatusFilter === 'ALL' || item.status === inventoryStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [inventory, globalSearch, inventoryCategoryFilter, inventoryStatusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchSearch = globalSearch === '' ||
        ord.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
        ord.customer.toLowerCase().includes(globalSearch.toLowerCase()) ||
        ord.email.toLowerCase().includes(globalSearch.toLowerCase());
      const matchStatus = orderStatusFilter === 'ALL' || ord.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, globalSearch, orderStatusFilter]);

  const filteredMembers = useMemo(() => {
    return members.filter(mem => {
      const matchSearch = globalSearch === '' ||
        mem.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        mem.email.toLowerCase().includes(globalSearch.toLowerCase()) ||
        mem.id.toLowerCase().includes(globalSearch.toLowerCase());
      const matchTier = memberTierFilter === 'ALL' || 
        (memberTierFilter === 'VIP' ? mem.tier.includes('VIP') : !mem.tier.includes('VIP'));
      return matchSearch && matchTier;
    });
  }, [members, globalSearch, memberTierFilter]);

  // Change the screen only after persistence succeeds.
  const handleAddProduct = newProduct => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const result = await api.createProduct({ ...newProduct, quantity: Number(newProduct.stock), price: Number(newProduct.price) });
    if (!result?.success || !result.data) throw new Error('Product was not saved');
    setInventory(previous => [normalizeProduct(result.data), ...previous]);
    showToast('Product saved', 'success');
  });

  const handleRestock = (id, amount) => runMutation(async () => {
    if (isDemo) throw new Error('Demo session: changes are disabled');
    const item = inventory.find(product => product.id === id);
    if (!item) return;
    const quantity = Math.max(0, item.stock + amount);
    const result = await api.updateProduct(id, { quantity });
    if (!result?.success || !result.data) throw new Error('Stock was not saved');
    setInventory(previous => previous.map(product => product.id === id ? normalizeProduct(result.data) : product));
    showToast('Stock saved', 'success');
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

  const handleRestockSubmit = async (id) => {
    const amount = parseInt(restockAmounts[id], 10);
    if (!Number.isFinite(amount) || amount === 0) return;
    if (await handleRestock(id, amount)) setRestockAmounts(prev => ({ ...prev, [id]: '' }));
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
      kpis: { totalRevenue, totalOrders: orders.length, totalStockUnits, lowStockCount, vipMembersCount },
      inventory,
      orders,
      members,
      monthlyRevenue: monthlyData
    };
    downloadFile(JSON.stringify(backupData, null, 2), `MatchA_Full_Store_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Nav Items
  const navTabs = [
    { id: 'media', label: 'รูปสินค้า & Lookbook', icon: Layers, badge: null },
    { id: 'dashboard', label: 'Overview & KPIs', icon: LayoutDashboard, badge: null },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, badge: inventory.length },
    { id: 'orders', label: 'Orders Pipeline', icon: ClipboardList, badge: orders.filter(o => o.status === 'Processing').length },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3, badge: null },
    { id: 'members', label: 'VIP Customer Registry', icon: UserCheck, badge: vipMembersCount },
    { id: 'backup', label: 'Reports & Backups', icon: HardDrive, badge: null }
  ];

  return (
    <div className="min-h-screen bg-[#F1F1F1] text-[#000000] flex flex-col md:flex-row">
      
      {/* ========================================================================= */}
      {/* 1. LEFT DASHBOARD NAVIGATION SIDEBAR                                      */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-64 lg:w-72 bg-[#000000] text-white flex flex-col shrink-0 border-r border-[#3E322C] select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-[#3E322C]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#042509] flex items-center justify-center text-lg font-black text-white shadow-md">
                🍵
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight uppercase font-sans">MatchA Admin</h1>
                <span className="block text-[9px] font-mono text-[#518F5C] tracking-widest uppercase">
                  Command Center
                </span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#85E369] animate-pulse" title={Object.values(status).every(value => value === 'ready') ? 'Data loaded' : 'Data unavailable or loading'} />
          </div>
        </div>

        {/* Current Admin Identity Card */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-[#3A2E28] border border-[#4D3E35] flex items-center justify-between text-xs font-mono">
          <div className="truncate">
            <div className="text-[10px] text-[#518F5C] uppercase">Active Operator</div>
            <div className="font-bold text-white truncate">{currentUser?.name || 'Administrator'}</div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#C91D1D] text-white text-[10px] font-bold">
            {currentUser?.role || 'Admin'}
          </span>
        </div>

        {/* Navigation Tab Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-mono font-bold uppercase text-[#A89F91] px-3 py-2 tracking-wider">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#042509] text-white shadow-md translate-x-1'
                    : 'text-[#DCDCDC] hover:bg-[#3A2E28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-[#518F5C]' : 'text-[#A89F91]'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#C91D1D] text-white' : 'bg-[#4D3E35] text-[#518F5C]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Actions */}
        <div className="p-4 border-t border-[#3E322C] space-y-2 font-mono text-xs">
          <button
            onClick={() => navigate('/catalog')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3A2E28] hover:bg-[#4D3E35] text-[#518F5C] transition-colors cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#C91D1D] hover:bg-[#C91D1D]/10 transition-colors cursor-pointer font-bold"
          >
            <LogOut size={13} />
            <span>End Session</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD CONTENT CANVAS                                          */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {isDemo && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-6 py-2.5 text-xs font-mono font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <span>โหมดสาธิต (Demo Mode): จำลองข้อมูลบนเครื่องเท่านั้น — การแก้ไขหรือลบจะไม่กระทบฐานข้อมูลจริง</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-400 font-extrabold w-fit">
              READ-ONLY DEMO
            </span>
          </div>
        )}

        {/* Top Header Bar with Universal Search & Action Buttons */}
        <header className="sticky top-0 z-20 bg-[#F1F1F1]/90 backdrop-blur-md border-b border-[#DCDCDC] px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Breadcrumb & Tab Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#666666]">
              <span>Admin</span>
              <ChevronRight size={11} />
              <span className="text-[#042509] font-bold capitalize">{activeTab}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#000000]">
              {navTabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Global Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 inset-y-0 my-auto text-[#666666]" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search metrics, SKU, orders, members..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#DCDCDC] bg-white font-mono text-xs text-[#000000] outline-none focus:ring-2 focus:ring-[#042509]/40"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 inset-y-0 my-auto h-fit text-xs text-[#C91D1D] hover:font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Add Product Button */}
            <button
              onClick={() => { setMutationNotice(null); setIsAddModalOpen(true); }} disabled={saving || isDemo || status.inventory !== 'ready'}
              className="px-3.5 py-1.5 bg-[#042509] hover:bg-[#021505] text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Plus size={14} />
              <span>Add Garment</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-1.5 bg-white border border-[#DCDCDC] hover:border-[#042509] text-[#000000] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Download size={13} className="text-[#042509]" />
                <span>Export Data</span>
                <ChevronDown size={12} />
              </button>

              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#DCDCDC] shadow-2xl p-2 z-30 font-mono text-xs animate-fade-in">
                    <div className="p-1.5 space-y-1 border-b border-[#DCDCDC]/40">
                      <button
                        onClick={handleExportInventory}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F1F1] text-left transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={14} className="text-[#042509]" />
                        <span>Inventory CSV</span>
                      </button>
                      <button
                        onClick={handleExportOrders}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F1F1] text-left transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={14} className="text-[#042509]" />
                        <span>Orders Pipeline CSV</span>
                      </button>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleExportFullJSON}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#C91D1D]/10 text-[#C91D1D] font-bold text-left transition-colors cursor-pointer"
                      >
                        <FileJson size={14} />
                        <span>Admin Data Export (JSON)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Body Area */}
        <div ref={adminMotionRef} className="p-6 max-w-7xl w-full mx-auto space-y-8">
          
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & KPIS (EXECUTIVE DASHBOARD)                              */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={saving || Object.values(status).includes('loading')} onClick={() => { setSelectedOrderForModal(null); setMutationNotice(null); refresh(); }} className="px-4 py-2 rounded-lg bg-[#042509] text-white disabled:opacity-50">Refresh data</button>
            {saving && <span role="status">Saving changes…</span>}
            {mutationNotice && <p role={mutationNotice.error ? 'alert' : 'status'} className={mutationNotice.error ? 'text-red-800' : 'text-green-900'}>{mutationNotice.error && 'บันทึกไม่สำเร็จ / Save failed: '}{mutationNotice.text}</p>}
            {isDemo && <span>Demo session — changes disabled</span>}
          </div>
          {activeTab === 'media' && <MediaManager />}
          {activeTab === 'dashboard' && (
            <DashboardTab status={status} errors={errors} totalRevenue={totalRevenue} orders={orders} totalStockUnits={totalStockUnits} inventory={inventory} vipMembersCount={vipMembersCount} lowStockCount={lowStockCount} monthlyData={monthlyData} categoryDistribution={categoryDistribution} setActiveTab={setActiveTab} />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INVENTORY & STOCK MANAGEMENT                                       */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <InventoryTab status={status} errors={errors} setInventoryCategoryFilter={setInventoryCategoryFilter} inventoryCategoryFilter={inventoryCategoryFilter} inventoryStatusFilter={inventoryStatusFilter} setInventoryStatusFilter={setInventoryStatusFilter} filteredInventory={filteredInventory} restockAmounts={restockAmounts} handleRestockInputChange={handleRestockInputChange} handleRestockSubmit={handleRestockSubmit} saving={saving} isDemo={isDemo} handleDeleteProduct={handleDeleteProduct} />
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ORDERS PIPELINE                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <OrdersTab status={status} errors={errors} setOrderStatusFilter={setOrderStatusFilter} orderStatusFilter={orderStatusFilter} filteredOrders={filteredOrders} setSelectedOrderForModal={order => { setMutationNotice(null); setSelectedOrderForModal(order); }} saving={saving} isDemo={isDemo} handleUpdateOrderStatus={handleUpdateOrderStatus} />
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
            <MembersTab status={status} errors={errors} setMemberTierFilter={setMemberTierFilter} memberTierFilter={memberTierFilter} filteredMembers={filteredMembers} handleToggleVIPTier={handleToggleVIPTier} saving={saving} isDemo={isDemo} />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: REPORTS & SYSTEM BACKUPS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'backup' && (
            <BackupTab status={status} errors={errors} handleExportFullJSON={handleExportFullJSON} handleExportInventory={handleExportInventory} handleExportOrders={handleExportOrders} />
          )}

        </div>

      </main>

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
