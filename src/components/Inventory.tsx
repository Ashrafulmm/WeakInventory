import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Product, Category } from '../types';
import { Plus, Search, Edit2, Trash2, Package, Download, X, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', category: '', price: '', cost: '', stock: '', minStock: '10', unit: 'piece', barcode: '', description: '', isActive: true });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setProducts(await db.products.toArray());
    setCategories(await db.categories.toArray());
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  function openAddModal() {
    setEditingProduct(null);
    setFormData({ name: '', sku: `SKU-${String(Date.now()).slice(-4)}`, category: categories[0]?.name || '', price: '', cost: '', stock: '', minStock: '10', unit: 'piece', barcode: '', description: '', isActive: true });
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({ name: product.name, sku: product.sku, category: product.category, price: product.price.toString(), cost: product.cost.toString(), stock: product.stock.toString(), minStock: product.minStock.toString(), unit: product.unit, barcode: product.barcode, description: product.description, isActive: product.isActive });
    setShowModal(true);
  }

  async function saveProduct() {
    const now = new Date();
    const productData: Product = { name: formData.name, sku: formData.sku, category: formData.category, price: parseFloat(formData.price) || 0, cost: parseFloat(formData.cost) || 0, stock: parseInt(formData.stock) || 0, minStock: parseInt(formData.minStock) || 10, unit: formData.unit, barcode: formData.barcode, description: formData.description, image: '', createdAt: editingProduct?.createdAt || now, updatedAt: now, isActive: formData.isActive };
    if (editingProduct?.id) { await db.products.update(editingProduct.id, productData); } else { await db.products.add(productData); }
    setShowModal(false); loadData();
  }

  async function deleteProduct(id: number) { await db.products.delete(id); setShowDeleteConfirm(null); loadData(); }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold text-gray-800">{products.length}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><p className="text-sm text-gray-500">Inventory Value</p><p className="text-2xl font-bold text-green-600">${products.reduce((sum, p) => sum + (p.cost * p.stock), 0).toFixed(2)}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><p className="text-sm text-gray-500">Low Stock</p><p className="text-2xl font-bold text-orange-600">{products.filter(p => p.stock <= p.minStock).length}</p></div>
        <div className="bg-white rounded-xl p-4 border border-gray-100"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock <= 0).length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-500/25">
          <Plus className="w-4 h-4" />Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">{categories.find(c => c.name === product.category)?.icon || '📦'}</div>
                      <div><p className="text-sm font-medium text-gray-800">{product.name}</p><p className="text-xs text-gray-500">{product.barcode || 'No barcode'}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.sku}</td>
                  <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{product.category}</span></td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right"><span className={`font-medium ${product.stock <= 0 ? 'text-red-600' : product.stock <= product.minStock ? 'text-orange-600' : 'text-gray-800'}`}>{product.stock}</span><span className="text-gray-400 text-xs ml-1">{product.unit}</span></td>
                  <td className="px-4 py-3 text-center">{product.stock <= 0 ? <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">Out of Stock</span> : product.stock <= product.minStock ? <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Low Stock</span> : <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">In Stock</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setShowDeleteConfirm(product.id!)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-sm font-medium text-gray-700">SKU *</label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-sm font-medium text-gray-700">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="text-sm font-medium text-gray-700">Price *</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-sm font-medium text-gray-700">Cost *</label><input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-sm font-medium text-gray-700">Stock *</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-sm font-medium text-gray-700">Min Stock</label><input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={saveProduct} disabled={!formData.name || !formData.price} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50">{editingProduct ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteProduct(showDeleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
