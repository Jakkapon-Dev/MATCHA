import React, { useState, useEffect } from 'react';
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
  ChevronDown
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
];

const INITIAL_ORDERS = [
  { id: 'ORD-8921', customer: 'Sarah Jenkins', email: 'sarah.j@gmail.com', items: 2, total: 136.00, status: 'Processing', date: '2026-08-25' },
  { id: 'ORD-8920', customer: 'Kenji Takahashi', email: 'kenji.t@outlook.com', items: 1, total: 88.00, status: 'Shipped', date: '2026-08-24' },
  { id: 'ORD-8919', customer: 'Nattaporn S.', email: 'natta@matcha.vip', items: 4, total: 270.00, status: 'Delivered', date: '2026-08-23' },
  { id: 'ORD-8918', customer: 'Marcus Vance', email: 'marcus@vance.io', items: 1, total: 48.00, status: 'Pending', date: '2026-08-23' },
  { id: 'ORD-8917', customer: 'Elena Rostova', email: 'elena@fashion.co', items: 3, total: 223.00, status: 'Delivered', date: '2026-08-22' },
];

const INITIAL_MEMBERS = [
  { id: 'MEM-001', name: 'Alex Collector', email: 'alex@matcha.vip', tier: 'VIP Gold', spent: '$1,420', orders: 12, joined: '2025-11-10' },
  { id: 'MEM-002', name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', tier: 'VIP Silver', spent: '$580', orders: 4, joined: '2026-02-14' },
  { id: 'MEM-003', name: 'Kenji Takahashi', email: 'kenji.t@outlook.com', tier: 'VIP Bronze', spent: '$310', orders: 2, joined: '2026-05-01' },
  { id: 'MEM-004', name: 'Admin Master', email: 'admin@matcha.vip', tier: '👑 System Admin', spent: '$0', orders: 0, joined: '2025-01-01' },
];

export default function AdminPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('inventory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load Inventory from LocalStorage with fallback
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('matcha_admin_inventory');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [members] = useState(INITIAL_MEMBERS);

  // Sync inventory changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('matcha_admin_inventory', JSON.stringify(inventory));
    } catch (e) {
      console.error('Failed to sync inventory to localStorage', e);
    }
  }, [inventory]);

  // Download Blob Utility with UTF-8 BOM
  const downloadFile = (filename, content, mimeType = 'text/csv;charset=utf-8;') => {
    const isCsv = mimeType.includes('csv');
    const blobContent = isCsv ? '\uFEFF' + content : content;
    const blob = new Blob([blobContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 1. Export Inventory CSV
  const handleExportInventory = () => {
    const headers = ['SKU ID', 'Garment Name', 'Category', 'Price (USD)', 'Stock (pcs)', 'Status', 'Color', 'Fit', 'Season', 'Created Date'];
    const rows = inventory.map(item => [
      `"${item.id}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.category || ''}"`,
      Number(item.price || 0).toFixed(2),
      item.stock || 0,
      `"${item.status || ''}"`,
      `"${item.color || ''}"`,
      `"${item.fit || ''}"`,
      `"${item.season || ''}"`,
      `"${item.createdAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(`MatchA_Inventory_${getTodayDateStr()}.csv`, csvContent);
    showToast('Exported Inventory CSV successfully! 📊');
    setIsExportMenuOpen(false);
  };

  // 2. Export Orders CSV
  const handleExportOrders = () => {
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Items (pcs)', 'Total Amount (USD)', 'Fulfillment Status'];
    const rows = orders.map(ord => [
      `"${ord.id}"`,
      `"${(ord.customer || '').replace(/"/g, '""')}"`,
      `"${ord.email || ''}"`,
      `"${ord.date || ''}"`,
      ord.items || 0,
      Number(ord.total || 0).toFixed(2),
      `"${ord.status || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(`MatchA_Orders_${getTodayDateStr()}.csv`, csvContent);
    showToast('Exported Customer Orders CSV! 🚚');
    setIsExportMenuOpen(false);
  };

  // 3. Export Analytics & Revenue CSV
  const handleExportAnalytics = () => {
    const months = [
      { month: 'Jan 2026', revenue: 24000 },
      { month: 'Feb 2026', revenue: 32000 },
      { month: 'Mar 2026', revenue: 28000 },
      { month: 'Apr 2026', revenue: 45000 },
      { month: 'May 2026', revenue: 52000 },
      { month: 'Jun 2026', revenue: 68000 },
    ];

    const categoryShares = [
      { category: 'Tops & Knitwear', share: '45%' },
      { category: 'Bottoms & Denim', share: '25%' },
      { category: 'Outerwear & Coats', share: '20%' },
      { category: 'Accessories & Tea', share: '10%' },
    ];

    let csvContent = '=== MATCHA REVENUE & ANALYTICS SUMMARY ===\n';
    csvContent += `Generated Date: ${new Date().toLocaleString()}\n\n`;
    csvContent += 'Month,Monthly Revenue (USD)\n';
    months.forEach(m => {
      csvContent += `"${m.month}",${m.revenue}\n`;
    });
    csvContent += '\nCategory,Volume Share\n';
    categoryShares.forEach(c => {
      csvContent += `"${c.category}",${c.share}\n`;
    });

    downloadFile(`MatchA_Revenue_Analytics_${getTodayDateStr()}.csv`, csvContent);
    showToast('Exported Revenue Analytics Report! 📈');
    setIsExportMenuOpen(false);
  };

  // 4. Export VIP Members CSV
  const handleExportMembers = () => {
    const headers = ['Member ID', 'Name', 'Email', 'VIP Tier', 'Total Spent', 'Orders Count', 'Join Date'];
    const rows = members.map(mem => [
      `"${mem.id}"`,
      `"${(mem.name || '').replace(/"/g, '""')}"`,
      `"${mem.email || ''}"`,
      `"${mem.tier || ''}"`,
      `"${mem.spent || ''}"`,
      mem.orders || 0,
      `"${mem.joined || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(`MatchA_VIP_Registry_${getTodayDateStr()}.csv`, csvContent);
    showToast('Exported VIP Customer Directory! 👑');
    setIsExportMenuOpen(false);
  };

  // 5. Export Full Store Backup JSON
  const handleExportFullJSON = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      store: 'MatchA Apparel',
      kpis: {
        grossRevenue: 249850,
        totalStock: totalStockCount,
        catalogAssetValue: totalCatalogValue,
        membersCount: members.length + 838
      },
      inventory,
      orders,
      members
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    downloadFile(`MatchA_Full_Store_Backup_${getTodayDateStr()}.json`, jsonContent, 'application/json;charset=utf-8;');
    showToast('Exported Full Store Backup (JSON)! 💾');
    setIsExportMenuOpen(false);
  };

  // Export Dispatcher for current view
  const handleExportCurrentTab = () => {
    if (activeTab === 'inventory') handleExportInventory();
    else if (activeTab === 'orders') handleExportOrders();
    else if (activeTab === 'analytics') handleExportAnalytics();
    else if (activeTab === 'members') handleExportMembers();
  };

  // Unauthorized Guard State
  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="bg-white border border-[#D9D3C7] rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#BC5A36]/10 text-[#BC5A36] flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase text-[#2D231E]">Access Restricted</h1>
            <p className="text-xs font-mono text-[#6B5E55]">
              You must be signed in with an <strong className="text-[#2D231E]">Administrator</strong> account to view this control panel.
            </p>
          </div>
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#D9D3C7] text-left text-xs font-mono space-y-1">
            <div className="text-[#6B5E55]">Current Session:</div>
            <div className="font-bold text-[#2D231E]">
              {currentUser ? `${currentUser.name || currentUser.email} (Role: ${currentUser.role || 'Member'})` : 'Guest / Not Logged In'}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-3 bg-[#2D5A27] text-white text-xs font-bold font-mono uppercase rounded-xl shadow-md hover:bg-[#23471E] transition-all cursor-pointer"
            >
              Sign In as Admin
            </button>
            <button
              onClick={() => navigate('/account')}
              className="flex-1 py-3 border border-[#D9D3C7] text-xs font-bold font-mono uppercase text-[#2D231E] hover:bg-[#FAF8F5] rounded-xl transition-all cursor-pointer"
            >
              Back to Member View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Add Product
  const handleAddProduct = (newProduct) => {
    setInventory((prev) => [newProduct, ...prev]);
    showToast(`Added "${newProduct.name}" to inventory! 🍵📦`);
  };

  // Handle Restock
  const handleRestock = (id, delta = 10) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStock = Math.max(0, item.stock + delta);
          return {
            ...item,
            stock: nextStock,
            status: nextStock > 10 ? 'In Stock' : nextStock > 0 ? 'Low Stock' : 'Out of Stock'
          };
        }
        return item;
      })
    );
    showToast(`Updated stock for ${id} (${delta > 0 ? '+' : ''}${delta}) 📦`);
  };

  // Handle Delete Product
  const handleDeleteProduct = (id) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    showToast(`Deleted ${id} from catalog.`);
  };

  // Handle Order Status Cycle
  const handleCycleOrderStatus = (orderId) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const nextIdx = (statuses.indexOf(ord.status) + 1) % statuses.length;
          const nextStatus = statuses[nextIdx];
          return { ...ord, status: nextStatus };
        }
        return ord;
      })
    );
    showToast(`Updated order ${orderId} status! 🚚`);
  };

  // Filtered Inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalStockCount = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalCatalogValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0);

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <main className="w-full max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D9D3C7]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-widest mb-1.5">
              <ShieldCheck size={16} />
              <span>MatchA Operating System — Admin Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#2D231E] tracking-tight">
              Store Command Center
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative">
            <button
              onClick={() => navigate('/account')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF8F5] border border-[#D9D3C7] text-[#2D231E] text-xs font-bold font-mono uppercase rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <span>Switch to Member View</span>
              <ArrowUpRight size={14} />
            </button>

            {/* Export Data Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF8F5] border border-[#2D5A27]/40 hover:border-[#2D5A27] text-[#2D5A27] text-xs font-bold font-mono uppercase rounded-xl transition-all cursor-pointer shadow-2xs group"
                title="Export Store Analytics and Reports"
              >
                <Download size={15} className="text-[#2D5A27] group-hover:-translate-y-0.5 transition-transform" />
                <span>Export Data</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Popover */}
              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#D9D3C7] shadow-xl p-2 z-30 font-mono text-xs animate-fade-in">
                    <div className="p-2 space-y-1 border-b border-[#D9D3C7]/50">
                      <div className="text-[10px] font-bold uppercase text-[#6B5E55] px-2 tracking-wider">Quick Action</div>
                      <button
                        onClick={handleExportCurrentTab}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#D0DEC6]/30 text-[#2D5A27] font-bold text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={15} />
                          <span>Export Active Tab (CSV)</span>
                        </div>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 bg-[#2D5A27] text-white rounded-md">
                          {activeTab}
                        </span>
                      </button>
                    </div>

                    <div className="p-2 space-y-1 border-b border-[#D9D3C7]/50">
                      <div className="text-[10px] font-bold uppercase text-[#6B5E55] px-2 tracking-wider">Spreadsheet Datasets (CSV)</div>
                      <button
                        onClick={handleExportInventory}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#2D231E] font-medium text-left transition-colors cursor-pointer"
                      >
                        <Package size={14} className="text-[#2D5A27]" />
                        <span>Inventory & Garments</span>
                      </button>
                      <button
                        onClick={handleExportOrders}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#2D231E] font-medium text-left transition-colors cursor-pointer"
                      >
                        <ShoppingBag size={14} className="text-[#2D5A27]" />
                        <span>Customer Orders Pipeline</span>
                      </button>
                      <button
                        onClick={handleExportAnalytics}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#2D231E] font-medium text-left transition-colors cursor-pointer"
                      >
                        <BarChart3 size={14} className="text-[#2D5A27]" />
                        <span>Revenue & Category KPI</span>
                      </button>
                      <button
                        onClick={handleExportMembers}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#2D231E] font-medium text-left transition-colors cursor-pointer"
                      >
                        <Users size={14} className="text-[#D4A338]" />
                        <span>VIP Customer Registry</span>
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-[#6B5E55] px-2 tracking-wider">System Backup</div>
                      <button
                        onClick={handleExportFullJSON}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#BC5A36]/10 text-[#BC5A36] font-bold text-left transition-colors cursor-pointer"
                      >
                        <FileJson size={14} />
                        <span>Full Store Backup (JSON)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Plus size={16} />
              <span>Add Garment</span>
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
              <span>Gross Revenue</span>
              <DollarSign size={16} className="text-[#2D5A27]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono mt-2">$249,850</div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#2D5A27] font-bold mt-1">
              <TrendingUp size={12} />
              <span>+18.4% this month</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
              <span>Live Inventory Stock</span>
              <Package size={16} className="text-[#2D5A27]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono mt-2">{totalStockCount} pcs</div>
            <div className="text-[11px] font-mono text-[#6B5E55] mt-1">{inventory.length} active styles</div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
              <span>Inventory Asset Value</span>
              <Layers size={16} className="text-[#BC5A36]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono mt-2">${totalCatalogValue.toLocaleString()}</div>
            <div className="text-[11px] font-mono text-[#2D5A27] font-bold mt-1">Warehouse Valuation</div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
              <span>VIP Members</span>
              <Users size={16} className="text-[#D4A338]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D231E] font-mono mt-2">{members.length + 838}</div>
            <div className="text-[11px] font-mono text-[#2D5A27] font-bold mt-1">+46 signups this week</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#D9D3C7] gap-2 overflow-x-auto pb-1">
          {[
            { id: 'inventory', label: 'Inventory & Garments', icon: Package, count: inventory.length },
            { id: 'orders', label: 'Order Fulfillment', icon: ShoppingBag, count: orders.length },
            { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
            { id: 'members', label: 'VIP Customer Registry', icon: Users, count: members.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#2D5A27] text-[#2D5A27] bg-[#D0DEC6]/30 rounded-t-xl'
                    : 'border-transparent text-[#6B5E55] hover:text-[#2D231E] hover:bg-white/50 rounded-t-xl'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-[#2D5A27] text-white' : 'bg-[#D9D3C7]/60 text-[#2D231E]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Filter & Search Bar + Tab Export */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                <input
                  type="text"
                  placeholder="Search SKU, name, color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono text-[#2D231E] outline-none focus:ring-1 focus:ring-[#2D5A27]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['ALL', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-[#2D5A27] text-white'
                          : 'bg-[#FAF8F5] border border-[#D9D3C7] text-[#6B5E55] hover:text-[#2D231E]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportInventory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#D0DEC6]/40 border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D5A27] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ml-auto sm:ml-2"
                  title="Download Inventory CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#D9D3C7] text-[#6B5E55] uppercase text-[10px]">
                    <th className="py-3 px-3">Item</th>
                    <th className="py-3 px-3">SKU ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock Level</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D3C7]/60">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#D9D3C7] overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-[#2D231E] max-w-60 truncate">{item.name}</div>
                            <div className="text-[10px] text-[#6B5E55]">{item.color} · {item.fit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">{item.id}</td>
                      <td className="py-3.5 px-3 text-[#6B5E55]">{item.category}</td>
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">${Number(item.price).toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">{item.stock} pcs</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          item.status === 'In Stock'
                            ? 'bg-[#D0DEC6] text-[#2D5A27]'
                            : item.status === 'Low Stock'
                            ? 'bg-[#D4A338]/20 text-[#D4A338]'
                            : 'bg-[#BC5A36]/20 text-[#BC5A36]'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRestock(item.id, 10)}
                            className="px-2 py-1 rounded-md border border-[#D9D3C7] hover:border-[#2D5A27] hover:bg-[#D0DEC6]/30 text-[11px] font-bold text-[#2D5A27] transition-all cursor-pointer"
                            title="Add +10 stock"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleRestock(item.id, -5)}
                            className="px-2 py-1 rounded-md border border-[#D9D3C7] hover:border-[#BC5A36] hover:bg-[#BC5A36]/10 text-[11px] font-bold text-[#6B5E55] hover:text-[#BC5A36] transition-all cursor-pointer"
                            title="Decrement -5 stock"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-1.5 rounded-md text-[#6B5E55] hover:text-[#BC5A36] hover:bg-[#BC5A36]/10 transition-colors cursor-pointer ml-1"
                            title="Delete garment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-[#6B5E55] font-mono text-xs">
                        No garments match current filter or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9D3C7] gap-3">
              <div>
                <h3 className="text-base font-extrabold uppercase text-[#2D231E]">Customer Orders Management</h3>
                <p className="text-xs font-mono text-[#6B5E55]">Click status badge to advance order pipeline</p>
              </div>

              <button
                onClick={handleExportOrders}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#D0DEC6]/40 border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D5A27] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer w-fit"
                title="Download Orders CSV"
              >
                <Download size={13} />
                <span>Export Orders CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#D9D3C7] text-[#6B5E55] uppercase text-[10px]">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Fulfillment Status</th>
                    <th className="py-3 px-3 text-right">Cycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D3C7]/60">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">{ord.id}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#2D231E]">{ord.customer}</div>
                        <div className="text-[10px] text-[#6B5E55]">{ord.email}</div>
                      </td>
                      <td className="py-3.5 px-3 text-[#6B5E55]">{ord.date}</td>
                      <td className="py-3.5 px-3 text-[#2D231E] font-bold">{ord.items} pcs</td>
                      <td className="py-3.5 px-3 font-bold text-[#2D5A27]">${ord.total.toFixed(2)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          ord.status === 'Delivered'
                            ? 'bg-[#D0DEC6] text-[#2D5A27]'
                            : ord.status === 'Shipped'
                            ? 'bg-[#D0DEC6]/50 text-[#2D5A27]'
                            : ord.status === 'Processing'
                            ? 'bg-[#D4A338]/20 text-[#D4A338]'
                            : 'bg-[#6B5E55]/20 text-[#6B5E55]'
                        }`}>
                          {ord.status === 'Delivered' && <CheckCircle2 size={12} />}
                          {ord.status === 'Shipped' && <Truck size={12} />}
                          {ord.status === 'Processing' && <Clock size={12} />}
                          {ord.status === 'Pending' && <AlertTriangle size={12} />}
                          <span>{ord.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleCycleOrderStatus(ord.id)}
                          className="px-3 py-1 bg-[#FAF8F5] hover:bg-[#D0DEC6]/40 border border-[#D9D3C7] text-[#2D231E] hover:text-[#2D5A27] rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Advance ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REVENUE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <button
                onClick={handleExportAnalytics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#D0DEC6]/40 border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D5A27] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs"
                title="Download Analytics Report"
              >
                <Download size={13} />
                <span>Export Revenue Analytics (CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-[#2D231E] font-mono">Monthly Revenue Performance</h3>
                    <p className="text-[11px] font-mono text-[#6B5E55]">Direct ecommerce cashflow (Jan - Jun 2026)</p>
                  </div>
                  <BarChart3 size={18} className="text-[#2D5A27]" />
                </div>

                <div className="h-56 flex items-end justify-between gap-3 pt-8 px-2">
                  {[
                    { month: 'Jan', revenue: 24000 },
                    { month: 'Feb', revenue: 32000 },
                    { month: 'Mar', revenue: 28000 },
                    { month: 'Apr', revenue: 45000 },
                    { month: 'May', revenue: 52000 },
                    { month: 'Jun', revenue: 68000 },
                  ].map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-[#2D5A27] opacity-0 group-hover:opacity-100 transition-opacity">
                        ${item.revenue / 1000}k
                      </span>
                      <div 
                        className="w-full bg-[#D0DEC6] group-hover:bg-[#2D5A27] rounded-t-xl transition-all duration-300 relative overflow-hidden"
                        style={{ height: `${(item.revenue / 70000) * 100}%` }}
                      >
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#2D5A27]/40" />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#6B5E55]">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-[#2D231E] font-mono">Category Volume Share</h3>
                    <p className="text-[11px] font-mono text-[#6B5E55]">Sales breakdown across product groups</p>
                  </div>
                  <Layers size={18} className="text-[#BC5A36]" />
                </div>

                <div className="space-y-4 pt-2 font-mono text-xs">
                  {[
                    { name: 'Tops & Knitwear', percent: 45, color: '#2D5A27' },
                    { name: 'Bottoms & Denim', percent: 25, color: '#556B2F' },
                    { name: 'Outerwear & Coats', percent: 20, color: '#BC5A36' },
                    { name: 'Accessories & Tea', percent: 10, color: '#D4A338' },
                  ].map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-[#2D231E]">
                        <span className="font-bold">{cat.name}</span>
                        <span className="font-bold text-[#2D5A27]">{cat.percent}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#FAF8F5] border border-[#D9D3C7] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VIP MEMBERS REGISTRY */}
        {activeTab === 'members' && (
          <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9D3C7] gap-3">
              <div>
                <h3 className="text-base font-extrabold uppercase text-[#2D231E]">VIP Member Directory</h3>
                <p className="text-xs font-mono text-[#6B5E55]">Registered MatchA collectors & tier status</p>
              </div>

              <button
                onClick={handleExportMembers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#D0DEC6]/40 border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D5A27] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer w-fit"
                title="Download VIP Member Directory CSV"
              >
                <Download size={13} />
                <span>Export VIP Registry (CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#D9D3C7] text-[#6B5E55] uppercase text-[10px]">
                    <th className="py-3 px-3">Member ID</th>
                    <th className="py-3 px-3">Name & Email</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-3">Total Spent</th>
                    <th className="py-3 px-3">Total Orders</th>
                    <th className="py-3 px-3">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D3C7]/60">
                  {members.map((mem) => (
                    <tr key={mem.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">{mem.id}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#2D231E]">{mem.name}</div>
                        <div className="text-[10px] text-[#6B5E55]">{mem.email}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          mem.tier.includes('Admin')
                            ? 'bg-[#2D5A27] text-white'
                            : 'bg-[#D0DEC6] text-[#2D5A27]'
                        }`}>
                          {mem.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#2D231E]">{mem.spent}</td>
                      <td className="py-3.5 px-3 text-[#6B5E55]">{mem.orders} orders</td>
                      <td className="py-3.5 px-3 text-[#6B5E55]">{mem.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Add Garment Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

    </div>
  );
}
