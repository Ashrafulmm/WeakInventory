import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Sale } from '../types';
import { Search, Eye, X, Receipt, CreditCard, Banknote, Smartphone, Download, RefreshCw } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => { loadSales(); }, []);

  async function loadSales() {
    const allSales = await db.sales.toArray();
    setSales(allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) || s.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'all' || s.paymentMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const totalRevenue = filteredSales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0);

  function getPaymentIcon(method: string) {
    switch (method) { case 'cash': return Banknote; case 'card': return CreditCard; case 'mobile': return Smartphone; default: return CreditCard; }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p></div>
        <div className="bg-white rounded-xl p-5 border border-gray-100"><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold text-blue-600">{filteredSales.length}</p></div>
        <div className="bg-white rounded-xl p-5 border border-gray-100"><p className="text-sm text-gray-500">Avg. Transaction</p><p className="text-2xl font-bold text-gray-800">${filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : '0.00'}</p></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by sale # or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Methods</option><option value="cash">Cash</option><option value="card">Card</option><option value="mobile">Mobile</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sale #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => {
                const PayIcon = getPaymentIcon(sale.paymentMethod);
                return (
                  <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${sale.status === 'voided' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3"><span className="text-sm font-mono font-medium text-blue-600">{sale.saleNumber}</span></td>
                    <td className="px-4 py-3"><p className="text-sm text-gray-800">{new Date(sale.createdAt).toLocaleDateString()}</p><p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-3 text-center"><span className="text-sm text-gray-700">{sale.items.length} items</span></td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><PayIcon className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-600 capitalize">{sale.paymentMethod}</span></div></td>
                    <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-gray-800">${sale.total.toFixed(2)}</span></td>
                    <td className="px-4 py-3 text-center">{sale.status === 'completed' ? <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Completed</span> : <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">Voided</span>}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => setSelectedSale(sale)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div><p className="text-blue-200 text-sm">Sale Receipt</p><p className="text-2xl font-bold">{selectedSale.saleNumber}</p></div>
                <button onClick={() => setSelectedSale(null)} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-t border-dashed border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Items</p>
                {selectedSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <div><p className="text-sm text-gray-800">{item.name}</p><p className="text-xs text-gray-500">{item.quantity} × ${item.price.toFixed(2)}</p></div>
                    <p className="text-sm font-medium text-gray-800">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>${selectedSale.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>${selectedSale.tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span className="text-blue-600">${selectedSale.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
