import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Sale, Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Clock, Award, Calendar, Percent } from 'lucide-react';

type Period = '7d' | '30d' | '90d' | 'all';

export default function StatisticalReport() {
  const [period, setPeriod] = useState<Period>('30d');
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; sales: number; revenue: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; revenue: number; sales: number; profit: number }[]>([]);
  const [paymentData, setPaymentData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; revenue: number; profit: number }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; revenue: number; sales: number; color: string }[]>([]);
  const [profitMargin, setProfitMargin] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [avgTransaction, setAvgTransaction] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    const allSales = await db.sales.where('status').equals('completed').toArray();
    const allProducts = await db.products.toArray();
    setProducts(allProducts);

    const now = new Date();
    let filtered = allSales;
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - days);
      filtered = allSales.filter(s => new Date(s.createdAt) >= cutoff);
    }
    setSales(filtered);

    const revenue = filtered.reduce((sum, s) => sum + s.total, 0);
    setTotalRevenue(revenue);
    setAvgTransaction(filtered.length > 0 ? revenue / filtered.length : 0);

    let totalCost = 0;
    let totalItems = 0;
    const productSalesMap: Record<number, { quantity: number; revenue: number }> = {};
    const categoryMap: Record<string, { revenue: number; sales: number }> = {};

    filtered.forEach(sale => {
      sale.items.forEach(item => {
        totalItems += item.quantity;
        const product = allProducts.find(p => p.id === item.productId);
        const cost = product ? product.cost * item.quantity : 0;
        totalCost += cost;
        if (!productSalesMap[item.productId]) productSalesMap[item.productId] = { quantity: 0, revenue: 0 };
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
        const cat = product?.category || 'Other';
        if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, sales: 0 };
        categoryMap[cat].revenue += item.total;
        categoryMap[cat].sales += item.quantity;
      });
    });

    setTotalItemsSold(totalItems);
    const profit = revenue - totalCost;
    setTotalProfit(profit);
    setProfitMargin(revenue > 0 ? (profit / revenue) * 100 : 0);

    const topProds = Object.entries(productSalesMap).map(([id, data]) => {
      const product = allProducts.find(p => p.id === parseInt(id));
      return { name: product?.name || 'Unknown', quantity: data.quantity, revenue: data.revenue, profit: data.revenue - (product ? product.cost * data.quantity : 0) };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    setTopProducts(topProds);

    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#F97316', '#22C55E', '#EF4444', '#6366F1', '#8B5CF6'];
    const catStats = Object.entries(categoryMap).map(([name, data], i) => ({ ...data, name, color: colors[i % colors.length] })).sort((a, b) => b.revenue - a.revenue);
    setCategoryStats(catStats);

    const paymentMap: Record<string, number> = {};
    filtered.forEach(s => { paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] || 0) + s.total; });
    const paymentColors: Record<string, string> = { cash: '#10B981', card: '#3B82F6', mobile: '#8B5CF6' };
    setPaymentData(Object.entries(paymentMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: parseFloat(value.toFixed(2)), color: paymentColors[name] || '#6B7280' })));

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const dailyMap: Record<string, { revenue: number; sales: number; profit: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0, 0, 0, 0);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[key] = { revenue: 0, sales: 0, profit: 0 };
    }
    filtered.forEach(sale => {
      const date = new Date(sale.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap[key]) {
        dailyMap[key].revenue += sale.total;
        dailyMap[key].sales += 1;
        let saleCost = 0;
        sale.items.forEach(item => { const product = allProducts.find(p => p.id === item.productId); saleCost += product ? product.cost * item.quantity : 0; });
        dailyMap[key].profit += sale.total - saleCost;
      }
    });
    setDailyData(Object.entries(dailyMap).map(([date, data]) => ({ date, revenue: parseFloat(data.revenue.toFixed(2)), sales: data.sales, profit: parseFloat(data.profit.toFixed(2)) })));

    const hourMap: Record<string, { sales: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) { const label = `${h.toString().padStart(2, '0')}:00`; hourMap[label] = { sales: 0, revenue: 0 }; }
    filtered.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours();
      const label = `${hour.toString().padStart(2, '0')}:00`;
      hourMap[label].sales += 1;
      hourMap[label].revenue += sale.total;
    });
    setHourlyData(Object.entries(hourMap).map(([hour, data]) => ({ hour, sales: data.sales, revenue: parseFloat(data.revenue.toFixed(2)) })));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h3 className="text-lg font-bold text-gray-800">Statistical Analysis</h3><p className="text-sm text-gray-500">Comprehensive business performance insights</p></div>
        <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-200">
          {[{ id: '7d' as Period, label: '7 Days' }, { id: '30d' as Period, label: '30 Days' }, { id: '90d' as Period, label: '90 Days' }, { id: 'all' as Period, label: 'All Time' }].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.id ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-600" /></div></div><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div></div><p className="text-xs text-gray-500">Total Profit</p><p className="text-xl font-bold text-green-600">${totalProfit.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Percent className="w-4 h-4 text-purple-600" /></div></div><p className="text-xs text-gray-500">Profit Margin</p><p className="text-xl font-bold text-purple-600">{profitMargin.toFixed(1)}%</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-amber-600" /></div></div><p className="text-xs text-gray-500">Avg Transaction</p><p className="text-xl font-bold text-gray-800">${avgTransaction.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center"><Award className="w-4 h-4 text-rose-600" /></div></div><p className="text-xs text-gray-500">Items Sold</p><p className="text-xl font-bold text-gray-800">{totalItemsSold}</p></div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-1">Revenue & Profit Trend</h3>
        <p className="text-sm text-gray-500 mb-4">Daily performance over selected period</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} interval={Math.max(0, Math.floor(dailyData.length / 10) - 1)} />
            <YAxis stroke="#9CA3AF" fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRev)" name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fill="url(#colorProfit)" name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-5 h-5 text-blue-500" /><h3 className="font-bold text-gray-800">Hourly Sales Pattern</h3></div>
          <p className="text-sm text-gray-500 mb-4">When do customers buy the most?</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} interval={2} /><YAxis stroke="#9CA3AF" fontSize={11} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sales Count" /></BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-1">Payment Methods</h3>
          <p className="text-sm text-gray-500 mb-4">Revenue by payment type</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">{paymentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} /></PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {paymentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div><span className="text-sm text-gray-700">{item.name}</span></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-800">${item.value.toFixed(2)}</p><p className="text-xs text-gray-500">{totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-gray-800">Top Selling Products</h3></div>
          <div className="space-y-3">
            {topProducts.slice(0, 8).map((product, i) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{product.name}</p><div className="flex items-center gap-3 text-xs text-gray-500"><span>{product.quantity} sold</span><span>•</span><span>Profit: ${product.profit.toFixed(2)}</span></div></div>
                <div className="text-right"><p className="text-sm font-bold text-gray-800">${product.revenue.toFixed(2)}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Category Performance</h3>
          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const maxRevenue = Math.max(...categoryStats.map(c => c.revenue));
              const percentage = maxRevenue > 0 ? (cat.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div><span className="text-sm font-medium text-gray-700">{cat.name}</span></div>
                    <div className="text-right"><span className="text-sm font-bold text-gray-800">${cat.revenue.toFixed(2)}</span><span className="text-xs text-gray-500 ml-2">({cat.sales} items)</span></div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: cat.color }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-1"><Calendar className="w-5 h-5 text-indigo-500" /><h3 className="font-bold text-gray-800">Daily Sales Volume</h3></div>
        <p className="text-sm text-gray-500 mb-4">Number of transactions per day</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} interval={Math.max(0, Math.floor(dailyData.length / 10) - 1)} /><YAxis stroke="#9CA3AF" fontSize={11} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Line type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 3 }} name="Transactions" /></LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Period Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4"><p className="text-xs text-blue-600 font-medium">Total Transactions</p><p className="text-2xl font-bold text-blue-800 mt-1">{sales.length}</p></div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4"><p className="text-xs text-green-600 font-medium">Total Revenue</p><p className="text-2xl font-bold text-green-800 mt-1">${totalRevenue.toFixed(2)}</p></div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4"><p className="text-xs text-purple-600 font-medium">Total Profit</p><p className="text-2xl font-bold text-purple-800 mt-1">${totalProfit.toFixed(2)}</p></div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4"><p className="text-xs text-amber-600 font-medium">Avg Order Value</p><p className="text-2xl font-bold text-amber-800 mt-1">${avgTransaction.toFixed(2)}</p></div>
        </div>
      </div>
    </div>
  );
}
