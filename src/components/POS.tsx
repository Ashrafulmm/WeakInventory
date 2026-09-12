import { useState, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { Product, CartItem, Sale } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, Check, ShoppingBag, Percent } from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const allProducts = await db.products.where('isActive').equals(1).toArray();
    setProducts(allProducts);
    const cats = await db.categories.toArray();
    setCategories([{ name: 'All', icon: '📦' }, ...cats.map(c => ({ name: c.name, icon: c.icon }))]);
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function addToCart(product: Product) {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0 || newQty > item.product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }

  function removeFromCart(productId: number) {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity * (1 - item.discount / 100)), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const change = parseFloat(amountPaid || '0') - total;

  async function completeSale() {
    const saleNumber = `SAL-${String(Date.now()).slice(-5)}`;
    const sale: Sale = {
      saleNumber,
      items: cart.map(item => ({ productId: item.product.id!, name: item.product.name, quantity: item.quantity, price: item.product.price, discount: item.discount, total: item.product.price * item.quantity * (1 - item.discount / 100) })),
      subtotal: parseFloat(subtotal.toFixed(2)), tax: parseFloat(tax.toFixed(2)), discount: 0, total: parseFloat(total.toFixed(2)),
      paymentMethod, amountPaid: parseFloat(amountPaid || total.toFixed(2)), change: paymentMethod === 'cash' ? parseFloat(Math.max(0, change).toFixed(2)) : 0,
      customerName, notes: '', createdAt: new Date(), status: 'completed',
    };
    await db.sales.add(sale);
    for (const item of cart) { await db.products.update(item.product.id!, { stock: item.product.stock - item.quantity, updatedAt: new Date() }); }
    setLastSale(sale); setCart([]); setShowCheckout(false); setAmountPaid(''); setCustomerName('');
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); loadData();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search products, SKU, or barcode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === cat.name ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0} className={`bg-white rounded-xl p-3 border border-gray-100 text-left transition-all hover:shadow-md hover:border-blue-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="w-full h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-2 flex items-center justify-center text-2xl">
                {categories.find(c => c.name === product.category)?.icon || '📦'}
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
              <p className="text-xs text-gray-500">{product.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-blue-600">${product.price.toFixed(2)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{product.stock} {product.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:w-96 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-500" />Current Order</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-3 opacity-30" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Click products to add them</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">${item.product.price.toFixed(2)} each</p>
                </div>
                <button onClick={() => removeFromCart(item.product.id!)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id!, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id!, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                </div>
                <span className="text-sm font-bold text-gray-800">${(item.product.price * item.quantity * (1 - item.discount / 100)).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t"><span>Total</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
            </div>
            <button onClick={() => setShowCheckout(true)} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25">Checkout • ${total.toFixed(2)}</button>
          </div>
        )}
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer Name (optional)</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer" className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[{ method: 'cash' as const, icon: Banknote, label: 'Cash' }, { method: 'card' as const, icon: CreditCard, label: 'Card' }, { method: 'mobile' as const, icon: Smartphone, label: 'Mobile' }].map(({ method, icon: Icon, label }) => (
                    <button key={method} onClick={() => setPaymentMethod(method)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <Icon className="w-5 h-5" /><span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount Paid</label>
                  <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={total.toFixed(2)} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {amountPaid && parseFloat(amountPaid) >= total && <p className="text-sm text-green-600 mt-1">Change: ${change.toFixed(2)}</p>}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
              </div>
              <button onClick={completeSale} disabled={paymentMethod === 'cash' && amountPaid ? parseFloat(amountPaid) < total : false} className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed">Complete Sale</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && lastSale && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Check className="w-5 h-5" /></div>
            <div><p className="font-bold">Sale Complete!</p><p className="text-sm opacity-90">{lastSale.saleNumber} • ${lastSale.total.toFixed(2)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
