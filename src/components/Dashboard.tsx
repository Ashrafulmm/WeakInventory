import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Sale, Product } from '../types';
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, totalProducts: 0, lowStockItems: 0, todaySales: 0, todayRevenue: 0 });
  const [dailySales, setDailySales] = useState<{ date: string; revenue: number; sales: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const allSales = await db.sales.where('status').equals('completed').toArray();
    const allProducts = await db.products.where('isActive').equals(1).toArray();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySalesList = allSales.filter(s => new Date(s.createdAt) >= today);

    setStats({
      totalSales: allSales.length, totalRevenue: allSales.reduce((sum, s) => sum + s.total, 0),
      totalProducts: allProducts.length, lowStockItems: allProducts.filter(p => p.stock <= p.minStock).length,
      todaySales: todaySalesList.length, todayRevenue: todaySalesList.reduce((sum, s) => sum + s.total, 0),
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const daySales = allSales.filter(s => { const sd = new Date(s.createdAt); return sd >= date && sd < nextDate; });
      last7Days.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), revenue: parseFloat(daySales.reduce((sum, s) => sum + s.total, 0).toFixed(2)), sales: daySales.length });
    }
    setDailySales(last7Days);

    const catMap: Record<string, number> = {};
    allProducts.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#F97316', '#22C55E', '#EF4444', '#6366F1', '#8B5CF6'];
    setCategoryData(Object.entries(catMap).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })));

    setRecentSales([...allSales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    setLowStockProducts(allProducts.filter(p => p.stock <= p.minStock).slice(0, 5));
  }

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-600', change: '+12.5%', up: true },
    { label: 'Total Sales', value: stats.totalSales.toString(), icon: ShoppingCart, color: 'from-blue-500 to-indigo-600', change: '+8.2%', up: true },
    { label: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'from-purple-500 to-violet-600', change: '+3', up: true },
    { label: 'Low Stock', value: stats.lowStockItems.toString(), icon: AlertTriangle, color: 'from-orange-500 to-red-500', change: '-2', up: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {card.up ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                <span className={`text-sm font-medium ${card.up ? 'text-green-600' : 'text-red-600'}`}>{card.change}</span>
                <span className="text-sm text-gray-400 ml-1">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-medium">+12.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-1">Categories</h3>
          <p className="text-sm text-gray-500 mb-4">Product distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-xs text-gray-600 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{sale.saleNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">${sale.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 capitalize">{sale.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Low Stock Alert</h3>
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">{stats.lowStockItems} items</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku} • {product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{product.stock} left</p>
                  <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
