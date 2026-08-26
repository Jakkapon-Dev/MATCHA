import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Plus,
  BarChart3,
  Layers,
  Users,
  Search,
  Filter,
  Trash2,
  Edit3,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileJson,
  Check,
  ChevronDown,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  UserCheck,
  HardDrive,
  LogOut,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  CircleDollarSign,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddProductModal from '../components/admin/AddProductModal';

const INITIAL_INVENTORY = [
  {
    id: 'SKU-001',
    name: 'MatchA Heavyweight Boxy Tee',
    category: 'Tops',
    price: 48,
    stock: 45,
    status: 'In Stock',
    color: 'Matcha Green',
    fit: 'Boxy Oversized',
    season: 'SS26',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-01-15'
  },
  {
    id: 'SKU-002',
    name: 'MatchA Pleated Relaxed Trousers',
    category: 'Bottoms',
    price: 88,
    stock: 12,
    status: 'Low Stock',
    color: 'Charcoal Black',
    fit: 'Relaxed Tailored',
    season: 'SS26',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-02-10'
  },
  {
    id: 'SKU-003',
    name: 'MatchA Mineral Fleece Hoodie',
    category: 'Outerwear',
    price: 110,
    stock: 24,
    status: 'In Stock',
    color: 'Washed Olive',
    fit: 'Boxy Oversized',
    season: 'FW26',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-03-01'
  },
  {
    id: 'SKU-004',
    name: 'MatchA Ceramic Matcha Bowl (Artisan)',
    category: 'Accessories',
    price: 34,
    stock: 6,
    status: 'Low Stock',
    color: 'Glazed Earth',
    fit: 'Standard Fit',
    season: 'Core',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-03-20'
  },
  {
    id: 'SKU-005',
    name: 'MatchA Corduroy Bucket Hat',
    category: 'Accessories',
    price: 38,
    stock: 0,
    status: 'Out of Stock',
    color: 'Clay Tan',
    fit: 'Standard Fit',
    season: 'SS26',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-04-05'
  },
  {
    id: 'SKU-006',
    name: 'MatchA Kimono Wrap Cardigan',
    category: 'Outerwear',
    price: 125,
    stock: 19,
    status: 'In Stock',
    color: 'Deep Forest',
    fit: 'Relaxed Tailored',
    season: 'FW26',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-04-18'
  },
  {
    id: 'SKU-007',
    name: 'MatchA Relaxed Linen Overshirt',
    category: 'Tops',
    price: 74,
    stock: 31,
    status: 'In Stock',
    color: 'Soft Sage',
    fit: 'Relaxed Tailored',
    season: 'SS26',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-05-12'
  },
  {
    id: 'SKU-008',
    name: 'MatchA Wide-Leg Canvas Workpants',
    category: 'Bottoms',
    price: 92,
    stock: 4,
    status: 'Low Stock',
    color: 'Warm Khaki',
    fit: 'Wide Leg',
    season: 'FW26',
    image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-06-04'
  }
];

const INITIAL_ORDERS = [
  { id: 'ORD-8921', customer: 'Sarah Jenkins', email: 'sarah.j@gmail.com', items: 2, total: 136.00, status: 'Processing', date: '2026-08-25' },
  { id: 'ORD-8920', customer: 'Kenji Takahashi', email: 'kenji.t@outlook.com', items: 1, total: 88.00, status: 'Shipped', date: '2026-08-24' },
  { id: 'ORD-8919', customer: 'Elena Rostova', email: 'elena.r@yahoo.com', items: 3, total: 242.00, status: 'Delivered', date: '2026-08-22' },
  { id: 'ORD-8918', customer: 'Marcus Vance', email: 'marcus.v@proton.me', items: 1, total: 48.00, status: 'Delivered', date: '2026-08-20' },
  { id: 'ORD-8917', customer: 'Chloe Bennett', email: 'chloe.b@gmail.com', items: 4, total: 310.00, status: 'Processing', date: '2026-08-19' },
  { id: 'ORD-8916', customer: 'Nattapong Somchai', email: 'nat.somchai@matcha.vip', items: 2, total: 176.00, status: 'Pending', date: '2026-08-18' },
  { id: 'ORD-8915', customer: 'David Miller', email: 'd.miller@techcorp.io', items: 1, total: 110.00, status: 'Delivered', date: '2026-08-15' }
];

const INITIAL_MEMBERS = [
  { id: 'MEM-001', name: 'Nattapong Somchai', email: 'nat.somchai@matcha.vip', tier: 'VIP Connoisseur', totalSpent: 420.00, orders: 4, joined: '2026-01-10' },
  { id: 'MEM-002', name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', tier: 'Regular Member', totalSpent: 136.00, orders: 1, joined: '2026-03-14' },
  { id: 'MEM-003', name: 'Elena Rostova', email: 'elena.r@yahoo.com', tier: 'VIP Connoisseur', totalSpent: 680.00, orders: 6, joined: '2026-02-01' },
  { id: 'MEM-004', name: 'Kenji Takahashi', email: 'kenji.t@outlook.com', tier: 'Regular Member', totalSpent: 88.00, orders: 1, joined: '2026-04-20' },
  { id: 'MEM-005', name: 'Marcus Vance', email: 'marcus.v@proton.me', tier: 'Regular Member', totalSpent: 96.00, orders: 2, joined: '2026-05-11' },
  { id: 'MEM-006', name: 'Chloe Bennett', email: 'chloe.b@gmail.com', tier: 'VIP Connoisseur', totalSpent: 512.00, orders: 5, joined: '2026-01-28' }
];

const MONTHLY_REVENUE_DATA = [
  { month: 'Jan', revenue: 3200, orders: 42, target: 3000 },
  { month: 'Feb', revenue: 4100, orders: 55, target: 3500 },
  { month: 'Mar', revenue: 3800, orders: 49, target: 4000 },
  { month: 'Apr', revenue: 5200, orders: 68, target: 4500 },
  { month: 'May', revenue: 6400, orders: 81, target: 5000 },
  { month: 'Jun', revenue: 7100, orders: 92, target: 6000 },
  { month: 'Jul', revenue: 8450, orders: 110, target: 7000 },
  { month: 'Aug', revenue: 9820, orders: 128, target: 8000 }
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  // Active Tab View: 'dashboard' | 'inventory' | 'orders' | 'analytics' | 'members' | 'backup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Core Data States with localStorage persistence
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('matcha_admin_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('matcha_admin_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('matcha_admin_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  // Global & Tab Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [memberTierFilter, setMemberTierFilter] = useState('ALL');

  useEffect(() => {
    localStorage.setItem('matcha_admin_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('matcha_admin_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('matcha_admin_members', JSON.stringify(members));
  }, [members]);

  // Auth Guard
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.email === 'admin@matcha.com';

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.status !== 'Cancelled' ? ord.total : 0), 0);
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

  // Inventory Actions
  const handleAddProduct = (newProduct) => {
    setInventory(prev => [newProduct, ...prev]);
    showToast(`Garment "${newProduct.name}" created successfully!`, 'success');
  };

  const handleRestock = (id, amount) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + amount);
        let newStatus = 'In Stock';
        if (newStock === 0) newStatus = 'Out of Stock';
        else if (newStock <= 10) newStatus = 'Low Stock';
        return { ...item, stock: newStock, status: newStatus };
      }
      return item;
    }));
    showToast(`Stock updated (${amount > 0 ? `+${amount}` : amount})`, 'info');
  };

  const handleDeleteProduct = (id) => {
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    showToast(`Deleted "${item?.name || id}" from inventory`, 'info');
  };

  // Order Actions
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord));
    showToast(`Order ${orderId} updated to ${newStatus}`, 'success');
  };

  // Member Actions
  const handleToggleVIPTier = (memberId) => {
    setMembers(prev => prev.map(mem => {
      if (mem.id === memberId) {
        const isCurrentlyVIP = mem.tier.includes('VIP');
        const newTier = isCurrentlyVIP ? 'Regular Member' : 'VIP Connoisseur';
        return { ...mem, tier: newTier };
      }
      return mem;
    }));
    showToast(`Member tier updated!`, 'success');
  };

  // Export File Helper
  const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
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
      monthlyRevenue: MONTHLY_REVENUE_DATA
    };
    downloadFile(JSON.stringify(backupData, null, 2), `MatchA_Full_Store_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Nav Items
  const navTabs = [
    { id: 'dashboard', label: 'Overview & KPIs', icon: LayoutDashboard, badge: null },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, badge: inventory.length },
    { id: 'orders', label: 'Orders Pipeline', icon: ClipboardList, badge: orders.filter(o => o.status === 'Processing').length },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3, badge: null },
    { id: 'members', label: 'VIP Customer Registry', icon: UserCheck, badge: vipMembersCount },
    { id: 'backup', label: 'Reports & Backups', icon: HardDrive, badge: null }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] flex flex-col md:flex-row">
      
      {/* ========================================================================= */}
      {/* 1. LEFT DASHBOARD NAVIGATION SIDEBAR                                      */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-64 lg:w-72 bg-[#2D231E] text-white flex flex-col shrink-0 border-r border-[#3E322C] select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-[#3E322C]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2D5A27] flex items-center justify-center text-lg font-black text-white shadow-md">
                🍵
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight uppercase font-sans">MatchA Admin</h1>
                <span className="block text-[9px] font-mono text-[#D0DEC6] tracking-widest uppercase">
                  Command Center
                </span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#85E369] animate-pulse" title="System Live" />
          </div>
        </div>

        {/* Current Admin Identity Card */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-[#3A2E28] border border-[#4D3E35] flex items-center justify-between text-xs font-mono">
          <div className="truncate">
            <div className="text-[10px] text-[#D0DEC6] uppercase">Active Operator</div>
            <div className="font-bold text-white truncate">{currentUser?.name || 'Administrator'}</div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#BC5A36] text-white text-[10px] font-bold">
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
                    ? 'bg-[#2D5A27] text-white shadow-md translate-x-1'
                    : 'text-[#D9D3C7] hover:bg-[#3A2E28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-[#D0DEC6]' : 'text-[#A89F91]'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#BC5A36] text-white' : 'bg-[#4D3E35] text-[#D0DEC6]'
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3A2E28] hover:bg-[#4D3E35] text-[#D0DEC6] transition-colors cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#BC5A36] hover:bg-[#BC5A36]/10 transition-colors cursor-pointer font-bold"
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
        
        {/* Top Header Bar with Universal Search & Action Buttons */}
        <header className="sticky top-0 z-20 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#D9D3C7] px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Breadcrumb & Tab Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B5E55]">
              <span>Admin</span>
              <ChevronRight size={11} />
              <span className="text-[#2D5A27] font-bold capitalize">{activeTab}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#2D231E]">
              {navTabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Global Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search metrics, SKU, orders, members..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9D3C7] bg-white font-mono text-xs text-[#2D231E] outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#BC5A36] hover:font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Add Product Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#2D5A27] hover:bg-[#23471E] text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Plus size={14} />
              <span>Add Garment</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-1.5 bg-white border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D231E] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Download size={13} className="text-[#2D5A27]" />
                <span>Export Data</span>
                <ChevronDown size={12} />
              </button>

              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-2 z-30 font-mono text-xs animate-fade-in">
                    <div className="p-1.5 space-y-1 border-b border-[#D9D3C7]/40">
                      <button
                        onClick={handleExportInventory}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={14} className="text-[#2D5A27]" />
                        <span>Inventory CSV</span>
                      </button>
                      <button
                        onClick={handleExportOrders}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={14} className="text-[#2D5A27]" />
                        <span>Orders Pipeline CSV</span>
                      </button>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleExportFullJSON}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#BC5A36]/10 text-[#BC5A36] font-bold text-left transition-colors cursor-pointer"
                      >
                        <FileJson size={14} />
                        <span>Full Store Backup (JSON)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Body Area */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-8">
          
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & KPIS (EXECUTIVE DASHBOARD)                              */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* 4 Top Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI 1: Gross Revenue */}
                <div className="p-5 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
                    <span>Total Gross Revenue</span>
                    <div className="w-8 h-8 rounded-xl bg-[#D0DEC6]/50 text-[#2D5A27] flex items-center justify-center font-bold">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#2D5A27] font-mono">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2D5A27] font-bold mt-1">
                      <ArrowUpRight size={13} />
                      <span>+24.8% vs last month</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Total Orders */}
                <div className="p-5 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
                    <span>Customer Orders</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#BC5A36] flex items-center justify-center font-bold">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono">
                      {orders.length} <span className="text-xs font-normal text-[#6B5E55]">orders</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#6B5E55] mt-1">
                      Avg. Value: ${(totalRevenue / (orders.length || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* KPI 3: Stock Units */}
                <div className="p-5 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
                    <span>Active Stock Units</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                      <Package size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono">
                      {totalStockUnits} <span className="text-xs font-normal text-[#6B5E55]">units</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#6B5E55] mt-1">
                      Across {inventory.length} garment lines
                    </div>
                  </div>
                </div>

                {/* KPI 4: VIP Customers & Alerts */}
                <div className="p-5 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
                    <span>VIP Member Vault</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Users size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                      {vipMembersCount} <span className="text-xs font-normal text-[#6B5E55]">VIPs</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#BC5A36] font-bold mt-1">
                      <AlertTriangle size={12} />
                      <span>{lowStockCount} Low stock alerts</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Monthly Revenue Bar Chart & Category Share Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Chart: Monthly Revenue Histogram */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D9D3C7]">
                    <div>
                      <h3 className="font-bold text-base uppercase font-sans">Monthly Revenue Performance</h3>
                      <p className="text-xs font-mono text-[#6B5E55]">2026 Fiscal Year Trajectory ($USD)</p>
                    </div>
                    <span className="px-3 py-1 bg-[#D0DEC6]/50 text-[#2D5A27] font-mono text-xs font-bold rounded-lg">
                      YTD: $48,170
                    </span>
                  </div>

                  {/* Histogram Bars */}
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
                    {MONTHLY_REVENUE_DATA.map((item) => {
                      const maxRevenue = 10000;
                      const heightPercent = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                      const isCurrentMonth = item.month === 'Aug';

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          {/* Hover Tooltip Value */}
                          <span className="text-[10px] font-mono font-bold text-[#6B5E55] opacity-0 group-hover:opacity-100 transition-opacity">
                            ${(item.revenue / 1000).toFixed(1)}k
                          </span>
                          
                          {/* Bar Container */}
                          <div className="w-full max-w-10.5 bg-[#FAF8F5] rounded-t-xl h-full flex items-end p-1 relative overflow-hidden">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                                isCurrentMonth ? 'bg-[#BC5A36]' : 'bg-[#2D5A27]'
                              }`}
                            />
                          </div>

                          <span className="text-xs font-mono font-bold text-[#2D231E]">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Chart: Category Distribution */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D9D3C7]">
                      <h3 className="font-bold text-sm uppercase font-sans">Category Share</h3>
                      <span className="text-[10px] font-mono text-[#6B5E55]">Volume</span>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Tops & Knitwear', count: 24, percent: 40, color: '#2D5A27' },
                        { label: 'Bottoms & Denim', count: 16, percent: 27, color: '#BC5A36' },
                        { label: 'Accessories & Bags', count: 16, percent: 27, color: '#D4A338' },
                        { label: 'Outerwear & Coats', count: 4, percent: 6, color: '#1A365D' }
                      ].map(cat => (
                        <div key={cat.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#2D231E] font-medium">{cat.label}</span>
                            <span className="font-bold text-[#6B5E55]">{cat.count} items ({cat.percent}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#D9D3C7]/40">
                            <div
                              style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D9D3C7] mt-6 text-xs font-mono flex items-center justify-between">
                    <span className="text-[#6B5E55]">Total Catalog</span>
                    <strong className="text-[#2D5A27]">{inventory.length} Models</strong>
                  </div>
                </div>

              </div>

              {/* Recent Orders Live Activity Table */}
              <div className="p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D9D3C7]">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#2D5A27]" />
                    <h3 className="font-bold text-base uppercase font-sans">Recent Customer Orders</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-mono font-bold text-[#2D5A27] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Pipeline</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#D9D3C7] text-[#6B5E55]">
                        <th className="pb-3 font-bold">Order ID</th>
                        <th className="pb-3 font-bold">Customer</th>
                        <th className="pb-3 font-bold">Date</th>
                        <th className="pb-3 font-bold">Total ($)</th>
                        <th className="pb-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3C7]/40">
                      {orders.slice(0, 4).map(ord => (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5]/80">
                          <td className="py-3 font-bold text-[#2D5A27]">{ord.id}</td>
                          <td className="py-3 text-[#2D231E]">{ord.customer}</td>
                          <td className="py-3 text-[#6B5E55]">{ord.date}</td>
                          <td className="py-3 font-bold text-[#2D231E]">${ord.total.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ord.status === 'Delivered'
                                ? 'bg-green-100 text-green-800'
                                : ord.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-[#BC5A36]'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INVENTORY & STOCK MANAGEMENT                                       */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Category Filter Pills & Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm">
                
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['ALL', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === cat
                          ? 'bg-[#2D5A27] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E]'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#6B5E55]">Stock:</span>
                  <select
                    value={inventoryStatusFilter}
                    onChange={(e) => setInventoryStatusFilter(e.target.value)}
                    className="px-3 py-1 rounded-xl border border-[#D9D3C7] bg-[#FAF8F5] text-xs font-mono font-bold text-[#2D231E] outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="rounded-2xl bg-white border border-[#D9D3C7] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#D9D3C7] text-[#6B5E55]">
                      <tr>
                        <th className="p-4 font-bold">Garment / SKU</th>
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold">Price</th>
                        <th className="p-4 font-bold">Stock</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Quick Restock & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3C7]/40">
                      {filteredInventory.map(item => (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-[#D9D3C7]" />
                              <div>
                                <div className="font-bold text-[#2D231E] text-sm">{item.name}</div>
                                <div className="text-[10px] text-[#6B5E55]">{item.id} • {item.color} • {item.fit}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-[#2D231E]">{item.category}</td>
                          <td className="p-4 font-bold text-[#2D5A27]">${item.price}</td>
                          <td className="p-4 font-bold">{item.stock}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              item.status === 'In Stock'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRestock(item.id, 10)}
                                className="px-2 py-1 rounded-lg bg-[#D0DEC6]/50 hover:bg-[#D0DEC6] text-[#2D5A27] font-bold text-[10px] cursor-pointer"
                                title="Add 10 Units"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleRestock(item.id, -5)}
                                className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#BC5A36] font-bold text-[10px] cursor-pointer"
                                title="Reduce 5 Units"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(item.id)}
                                className="p-1.5 rounded-lg text-[#BC5A36] hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredInventory.length === 0 && (
                  <div className="p-8 text-center font-mono text-xs text-[#6B5E55]">
                    No garments matching the selected filters.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ORDERS PIPELINE                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Order Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Processing', 'Shipped', 'Delivered', 'Pending'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      orderStatusFilter === st
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs'
                        : 'bg-white text-[#6B5E55] border-[#D9D3C7] hover:border-[#2D5A27]'
                    }`}
                  >
                    {st === 'ALL' ? 'All Orders' : st}
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-white border border-[#D9D3C7] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#D9D3C7] text-[#6B5E55]">
                      <tr>
                        <th className="p-4 font-bold">Order ID</th>
                        <th className="p-4 font-bold">Customer</th>
                        <th className="p-4 font-bold">Items</th>
                        <th className="p-4 font-bold">Amount</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3C7]/40">
                      {filteredOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-4 font-bold text-[#2D5A27]">{ord.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-[#2D231E]">{ord.customer}</div>
                            <div className="text-[10px] text-[#6B5E55]">{ord.email}</div>
                          </td>
                          <td className="p-4 text-[#2D231E]">{ord.items} pcs</td>
                          <td className="p-4 font-bold text-[#2D5A27]">${ord.total.toFixed(2)}</td>
                          <td className="p-4 text-[#6B5E55]">{ord.date}</td>
                          <td className="p-4">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-[#D9D3C7] bg-white font-mono text-xs font-bold text-[#2D231E] outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REVENUE ANALYTICS                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm">
                <h3 className="font-bold text-base uppercase font-sans mb-4">Financial Performance Breakdown</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D9D3C7]">
                    <div className="text-xs font-mono text-[#6B5E55]">YTD Gross Sales</div>
                    <div className="text-2xl font-black text-[#2D5A27] font-mono mt-1">$48,170.00</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D9D3C7]">
                    <div className="text-xs font-mono text-[#6B5E55]">Estimated Profit Margin</div>
                    <div className="text-2xl font-black text-[#2D231E] font-mono mt-1">68.4%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D9D3C7]">
                    <div className="text-xs font-mono text-[#6B5E55]">Cart Conversion Rate</div>
                    <div className="text-2xl font-black text-[#BC5A36] font-mono mt-1">4.2%</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#D9D3C7] text-[#6B5E55]">
                        <th className="pb-3 font-bold">Month</th>
                        <th className="pb-3 font-bold">Revenue ($)</th>
                        <th className="pb-3 font-bold">Orders</th>
                        <th className="pb-3 font-bold">Target ($)</th>
                        <th className="pb-3 font-bold">Target Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3C7]/40">
                      {MONTHLY_REVENUE_DATA.map(m => (
                        <tr key={m.month} className="hover:bg-[#FAF8F5]/80">
                          <td className="py-3 font-bold text-[#2D231E]">{m.month} 2026</td>
                          <td className="py-3 font-bold text-[#2D5A27]">${m.revenue.toLocaleString()}</td>
                          <td className="py-3">{m.orders}</td>
                          <td className="py-3 text-[#6B5E55]">${m.target.toLocaleString()}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.revenue >= m.target ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-[#BC5A36]'
                            }`}>
                              {m.revenue >= m.target ? 'Target Met ✦' : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: VIP CUSTOMER REGISTRY                                              */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex items-center gap-2">
                {['ALL', 'VIP', 'Regular'].map(t => (
                  <button
                    key={t}
                    onClick={() => setMemberTierFilter(t)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      memberTierFilter === t
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                        : 'bg-white text-[#6B5E55] border-[#D9D3C7] hover:border-[#2D5A27]'
                    }`}
                  >
                    {t === 'ALL' ? 'All Customers' : `${t} Tier`}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-white border border-[#D9D3C7] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#D9D3C7] text-[#6B5E55]">
                      <tr>
                        <th className="p-4 font-bold">Member ID</th>
                        <th className="p-4 font-bold">Customer Name</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Total Spent</th>
                        <th className="p-4 font-bold">Tier Level</th>
                        <th className="p-4 font-bold text-right">VIP Tier Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D3C7]/40">
                      {filteredMembers.map(mem => (
                        <tr key={mem.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-4 font-bold text-[#2D5A27]">{mem.id}</td>
                          <td className="p-4 font-bold text-[#2D231E]">{mem.name}</td>
                          <td className="p-4 text-[#6B5E55]">{mem.email}</td>
                          <td className="p-4 font-bold text-[#2D5A27]">${mem.totalSpent.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              mem.tier.includes('VIP')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {mem.tier}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleVIPTier(mem.id)}
                              className="px-3 py-1 rounded-lg border border-[#D9D3C7] hover:border-[#2D5A27] text-xs font-mono font-bold text-[#2D231E] transition-all cursor-pointer"
                            >
                              {mem.tier.includes('VIP') ? 'Demote to Regular' : 'Promote to VIP 👑'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: REPORTS & SYSTEM BACKUPS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Store JSON Backup Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#BC5A36] flex items-center justify-center font-bold mb-4">
                      <FileJson size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-[#2D231E] uppercase font-sans">Full System JSON Snapshot</h3>
                    <p className="text-xs font-mono text-[#6B5E55] mt-2 leading-relaxed">
                      Download complete MatchA database snapshot including all active garments, SKU specs, customer orders, and VIP member records.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#D9D3C7]">
                    <button
                      onClick={handleExportFullJSON}
                      className="w-full py-2.5 bg-[#BC5A36] hover:bg-[#9E4423] text-white rounded-xl font-mono text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      <span>Download JSON Backup Snapshot</span>
                    </button>
                  </div>
                </div>

                {/* CSV Spreadsheets Suite */}
                <div className="p-6 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#D0DEC6]/50 text-[#2D5A27] flex items-center justify-center font-bold mb-4">
                      <FileSpreadsheet size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-[#2D231E] uppercase font-sans">Spreadsheet Datasets (CSV)</h3>
                    <p className="text-xs font-mono text-[#6B5E55] mt-2 leading-relaxed">
                      Export structured CSV files with UTF-8 BOM encoding ready for Excel, Google Sheets, or external ERP data imports.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#D9D3C7] space-y-2 font-mono text-xs">
                    <button
                      onClick={handleExportInventory}
                      className="w-full py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Garment Inventory (CSV)</span>
                    </button>
                    <button
                      onClick={handleExportOrders}
                      className="w-full py-2 bg-[#FAF8F5] border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D231E] rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Orders Pipeline (CSV)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

    </div>
  );
}
