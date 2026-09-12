import { useState, useEffect } from 'react';
import { db, seedDatabase } from '../db/database';
import { Category } from '../types';
import { Save, Plus, Trash2, Database, Server, Globe, Shield, Palette } from 'lucide-react';

export default function Settings() {
  const [storeName, setStoreName] = useState('Weak Inventory Store');
  const [storeAddress, setStoreAddress] = useState('123 Main Street, City');
  const [storePhone, setStorePhone] = useState('+1 (555) 123-4567');
  const [taxRate, setTaxRate] = useState('8');
  const [currency, setCurrency] = useState('USD');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your purchase!');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [saved, setSaved] = useState(false);
  const [dbStats, setDbStats] = useState({ products: 0, sales: 0, categories: 0 });

  useEffect(() => { loadCategories(); loadDbStats(); loadSettings(); }, []);

  async function loadCategories() { setCategories(await db.categories.toArray()); }
  async function loadDbStats() { setDbStats({ products: await db.products.count(), sales: await db.sales.count(), categories: await db.categories.count() }); }

  function loadSettings() {
    const settings = localStorage.getItem('pos_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setStoreName(parsed.storeName || storeName); setStoreAddress(parsed.storeAddress || storeAddress);
      setStorePhone(parsed.storePhone || storePhone); setTaxRate(parsed.taxRate || taxRate);
      setCurrency(parsed.currency || currency); setReceiptFooter(parsed.receiptFooter || receiptFooter);
    }
  }

  function saveSettings() {
    localStorage.setItem('pos_settings', JSON.stringify({ storeName, storeAddress, storePhone, taxRate, currency, receiptFooter }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await db.categories.add({ name: newCategoryName, color: newCategoryColor, icon: '📦' });
    setNewCategoryName(''); loadCategories();
  }

  async function deleteCategory(id: number) { await db.categories.delete(id); loadCategories(); }

  async function clearDatabase() {
    if (confirm('Are you sure you want to clear ALL data?')) {
      await db.products.clear(); await db.sales.clear(); await db.categories.clear();
      loadDbStats(); loadCategories();
    }
  }

  async function resetAndReseed() {
    if (confirm('This will delete all data and reseed with sample data. Continue?')) {
      await db.products.clear(); await db.sales.clear(); await db.categories.clear();
      await seedDatabase(); loadDbStats(); loadCategories();
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Globe className="w-5 h-5 text-blue-600" /></div>
          <div><h3 className="font-bold text-gray-800">Store Settings</h3><p className="text-sm text-gray-500">Configure your store information</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-gray-700">Store Name</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="text-sm font-medium text-gray-700">Phone</label><input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700">Address</label><input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="text-sm font-medium text-gray-700">Tax Rate (%)</label><input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="text-sm font-medium text-gray-700">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
          <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700">Receipt Footer Message</label><input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <button onClick={saveSettings} className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 shadow-lg shadow-blue-500/25"><Save className="w-4 h-4" />Save Settings</button>
        {saved && <span className="ml-3 text-green-600 text-sm font-medium">✓ Settings saved!</span>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Palette className="w-5 h-5 text-purple-600" /></div>
          <div><h3 className="font-bold text-gray-800">Categories</h3><p className="text-sm text-gray-500">Manage product categories</p></div>
        </div>
        <div className="flex gap-3 mb-4">
          <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer" />
          <button onClick={addCategory} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center gap-2"><Plus className="w-4 h-4" />Add</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div><span className="text-sm font-medium text-gray-700">{cat.name}</span></div>
              <button onClick={() => deleteCategory(cat.id!)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Database className="w-5 h-5 text-green-600" /></div>
          <div><h3 className="font-bold text-gray-800">Database</h3><p className="text-sm text-gray-500">Database information and management</p></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-gray-800">{dbStats.products}</p><p className="text-xs text-gray-500">Products</p></div>
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-gray-800">{dbStats.sales}</p><p className="text-xs text-gray-500">Sales</p></div>
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-gray-800">{dbStats.categories}</p><p className="text-xs text-gray-500">Categories</p></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={resetAndReseed} className="px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 flex items-center gap-2"><Database className="w-4 h-4" />Reset & Reseed Data</button>
          <button onClick={clearDatabase} className="px-4 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 flex items-center gap-2"><Trash2 className="w-4 h-4" />Clear All Data</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="font-bold text-gray-800">Server Configuration</h3><p className="text-sm text-gray-500">Connect to your remote database server</p></div>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700">Server URL</label><input type="text" placeholder="https://api.yourserver.com" className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">API Key</label><input type="password" placeholder="Enter API key..." className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="text-sm font-medium text-gray-700">Database Type</label><select className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"><option>IndexedDB (Local)</option><option>PostgreSQL</option><option>MySQL</option><option>Firebase</option><option>Supabase</option></select></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div><p className="text-sm font-medium text-gray-800">Currently using local IndexedDB</p><p className="text-xs text-gray-500">Data is stored in your browser. Configure server URL above to sync with remote database.</p></div>
          </div>
          <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-600 flex items-center gap-2 shadow-lg shadow-indigo-500/25"><Server className="w-4 h-4" />Connect to Server</button>
        </div>
      </div>
    </div>
  );
}
