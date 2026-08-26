import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Layers, 
  Plus, 
  Edit3, 
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboardTab() {
  const { showToast } = useToast();

  const [inventory, setInventory] = useState([
    { id: 'SKU-001', name: 'MatchA Heavyweight Boxy Tee', category: 'Tops', price: 48, stock: 45, status: 'In Stock' },
    { id: 'SKU-002', name: 'MatchA Pleated Relaxed Trousers', category: 'Bottoms', price: 88, stock: 12, status: 'Low Stock' },
    { id: 'SKU-003', name: 'MatchA Mineral Fleece Hoodie', category: 'Outerwear', price: 110, stock: 24, status: 'In Stock' },
    { id: 'SKU-004', name: 'MatchA Ceramic Matcha Bowl (Artisan)', category: 'Accessories', price: 34, stock: 6, status: 'Low Stock' },
    { id: 'SKU-005', name: 'MatchA Corduroy Bucket Hat', category: 'Accessories', price: 38, stock: 0, status: 'Out of Stock' },
    { id: 'SKU-006', name: 'MatchA Kimono Wrap Cardigan', category: 'Outerwear', price: 125, stock: 19, status: 'In Stock' },
  ]);

  const monthlySales = [
    { month: 'Jan', sales: 24, revenue: 24000 },
    { month: 'Feb', sales: 32, revenue: 32000 },
    { month: 'Mar', sales: 28, revenue: 28000 },
    { month: 'Apr', sales: 45, revenue: 45000 },
    { month: 'May', sales: 52, revenue: 52000 },
    { month: 'Jun', sales: 68, revenue: 68000 },
  ];

  const categoryDistribution = [
    { name: 'Tops & Tees', percent: 45, color: '#2D5A27' },
    { name: 'Bottoms & Trousers', percent: 25, color: '#556B2F' },
    { name: 'Outerwear & Fleece', percent: 20, color: '#BC5A36' },
    { name: 'Accessories & Tea', percent: 10, color: '#D4A338' },
  ];

  const handleRestock = (id) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: item.stock + 10, status: 'In Stock' } : item
      )
    );
    showToast(`Restocked +10 units for ${id} 📦`);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Header & Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
            <span>Total Revenue</span>
            <DollarSign size={16} className="text-[#2D5A27]" />
          </div>
          <div className="text-2xl font-black text-[#2D231E] font-mono mt-2">$249,000</div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#2D5A27] font-bold mt-1">
            <TrendingUp size={12} />
            <span>+18.4% this month</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
            <span>Average Order</span>
            <ShoppingBag size={16} className="text-[#BC5A36]" />
          </div>
          <div className="text-2xl font-black text-[#2D231E] font-mono mt-2">$92.40</div>
          <div className="text-[11px] font-mono text-[#6B5E55] mt-1">Across 2,695 orders</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
            <span>Total Stock</span>
            <Package size={16} className="text-[#2D5A27]" />
          </div>
          <div className="text-2xl font-black text-[#2D231E] font-mono mt-2">1,420 pcs</div>
          <div className="text-[11px] font-mono text-[#2D5A27] font-bold mt-1">94% Fulfillment</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#D9D3C7] shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
            <span>VIP Members</span>
            <ShieldCheck size={16} className="text-[#D4A338]" />
          </div>
          <div className="text-2xl font-black text-[#2D231E] font-mono mt-2">842</div>
          <div className="text-[11px] font-mono text-[#2D5A27] font-bold mt-1">+46 this week</div>
        </div>

      </div>

      {/* 2. Dual Data Visualization Charts (Chart 1: Bar Chart & Chart 2: Donut/Segment Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Monthly Sales Revenue (Bar Chart) */}
        <div className="lg:col-span-7 bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7] mb-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[#2D231E] font-mono">
                Chart 1: Monthly Sales Revenue
              </h3>
              <p className="text-[11px] font-mono text-[#6B5E55]">Direct D2C Ecommerce Revenue (Jan - Jun 2026)</p>
            </div>
            <BarChart3 size={18} className="text-[#2D5A27]" />
          </div>

          {/* Rendered CSS Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlySales.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-[#2D5A27] opacity-0 group-hover:opacity-100 transition-opacity">
                  ${item.sales}k
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

        {/* CHART 2: Category Distribution (Segment Progress Bars) */}
        <div className="lg:col-span-5 bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7] mb-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[#2D231E] font-mono">
                Chart 2: Sales by Category
              </h3>
              <p className="text-[11px] font-mono text-[#6B5E55]">Volume share across product silos</p>
            </div>
            <Layers size={18} className="text-[#BC5A36]" />
          </div>

          <div className="space-y-4 pt-2">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#2D231E]">
                  <span className="font-bold">{cat.name}</span>
                  <span className="font-bold text-[#2D5A27]">{cat.percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#FAF8F5] border border-[#D9D3C7] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Admin Inventory Management Table */}
      <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D3C7]">
          <div>
            <div className="flex items-center gap-2">
              <Package size={18} className="text-[#2D5A27]" />
              <h3 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
                3. Admin Inventory Management
              </h3>
            </div>
            <p className="text-xs font-mono text-[#6B5E55] mt-0.5">
              Live warehouse stock levels, pricing, and rapid restock actions
            </p>
          </div>

          <button
            onClick={() => showToast('Opened Add Product Dialog (Admin Demo)')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={14} />
            <span>Add Garment</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#D9D3C7] text-[#6B5E55] uppercase text-[10px]">
                <th className="py-3 px-2">SKU ID</th>
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Price</th>
                <th className="py-3 px-2">Stock Level</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D3C7]/60">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-[#2D231E]">{item.id}</td>
                  <td className="py-3.5 px-2 font-bold text-[#2D231E] max-w-55 truncate">{item.name}</td>
                  <td className="py-3.5 px-2 text-[#6B5E55]">{item.category}</td>
                  <td className="py-3.5 px-2 font-bold text-[#2D231E]">${item.price.toFixed(2)}</td>
                  <td className="py-3.5 px-2 font-bold text-[#2D231E]">{item.stock} pcs</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      item.status === 'In Stock'
                        ? 'bg-[#D0DEC6] text-[#2D5A27]'
                        : item.status === 'Low Stock'
                        ? 'bg-[#D4A338]/20 text-[#D4A338]'
                        : 'bg-[#BC5A36]/20 text-[#BC5A36]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleRestock(item.id)}
                      className="px-2.5 py-1 rounded-lg border border-[#D9D3C7] hover:border-[#2D5A27] hover:bg-white text-[11px] font-bold text-[#2D5A27] transition-all cursor-pointer"
                    >
                      +10 Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
