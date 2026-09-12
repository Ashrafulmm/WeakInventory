import Dexie, { type Table } from 'dexie';
import { Product, Sale, Category } from '../types';

export class POSDatabase extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  categories!: Table<Category, number>;

  constructor() {
    super('WeakInventory');
    this.version(1).stores({
      products: '++id, name, sku, category, barcode, isActive, stock',
      sales: '++id, saleNumber, paymentMethod, status, createdAt',
      categories: '++id, name'
    });
  }
}

export const db = new POSDatabase();

export async function seedDatabase() {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd([
      { name: 'Beverages', color: '#3B82F6', icon: '🥤' },
      { name: 'Snacks', color: '#F59E0B', icon: '🍿' },
      { name: 'Dairy', color: '#10B981', icon: '🥛' },
      { name: 'Bakery', color: '#F97316', icon: '🍞' },
      { name: 'Produce', color: '#22C55E', icon: '🥬' },
      { name: 'Meat', color: '#EF4444', icon: '🥩' },
      { name: 'Frozen', color: '#6366F1', icon: '🧊' },
      { name: 'Household', color: '#8B5CF6', icon: '🏠' },
    ]);
  }

  const productCount = await db.products.count();
  if (productCount === 0) {
    const now = new Date();
    await db.products.bulkAdd([
      { name: 'Coca Cola 330ml', sku: 'BEV001', category: 'Beverages', price: 1.50, cost: 0.80, stock: 150, minStock: 20, unit: 'can', barcode: '5449000000996', description: 'Classic Coca Cola can', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Pepsi 330ml', sku: 'BEV002', category: 'Beverages', price: 1.40, cost: 0.75, stock: 120, minStock: 20, unit: 'can', barcode: '5449000000997', description: 'Pepsi cola can', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Orange Juice 1L', sku: 'BEV003', category: 'Beverages', price: 3.99, cost: 2.20, stock: 45, minStock: 10, unit: 'bottle', barcode: '5449000000998', description: 'Fresh orange juice', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Mineral Water 500ml', sku: 'BEV004', category: 'Beverages', price: 0.99, cost: 0.30, stock: 200, minStock: 50, unit: 'bottle', barcode: '5449000000999', description: 'Natural mineral water', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Potato Chips', sku: 'SNK001', category: 'Snacks', price: 2.99, cost: 1.50, stock: 80, minStock: 15, unit: 'bag', barcode: '5449000001001', description: 'Crispy potato chips', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Chocolate Bar', sku: 'SNK002', category: 'Snacks', price: 1.99, cost: 0.90, stock: 100, minStock: 20, unit: 'piece', barcode: '5449000001002', description: 'Milk chocolate bar', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Mixed Nuts 200g', sku: 'SNK003', category: 'Snacks', price: 4.99, cost: 2.80, stock: 35, minStock: 10, unit: 'pack', barcode: '5449000001003', description: 'Premium mixed nuts', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Whole Milk 1L', sku: 'DRY001', category: 'Dairy', price: 2.49, cost: 1.50, stock: 60, minStock: 15, unit: 'carton', barcode: '5449000001004', description: 'Fresh whole milk', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Cheddar Cheese 250g', sku: 'DRY002', category: 'Dairy', price: 3.99, cost: 2.30, stock: 25, minStock: 8, unit: 'pack', barcode: '5449000001005', description: 'Aged cheddar cheese', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Greek Yogurt', sku: 'DRY003', category: 'Dairy', price: 1.99, cost: 1.10, stock: 40, minStock: 10, unit: 'cup', barcode: '5449000001006', description: 'Plain Greek yogurt', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'White Bread', sku: 'BKR001', category: 'Bakery', price: 2.49, cost: 1.20, stock: 30, minStock: 10, unit: 'loaf', barcode: '5449000001007', description: 'Fresh white bread', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Croissant', sku: 'BKR002', category: 'Bakery', price: 1.99, cost: 0.80, stock: 20, minStock: 8, unit: 'piece', barcode: '5449000001008', description: 'Butter croissant', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Banana (per kg)', sku: 'PRD001', category: 'Produce', price: 1.29, cost: 0.60, stock: 50, minStock: 15, unit: 'kg', barcode: '5449000001009', description: 'Fresh bananas', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Apples (per kg)', sku: 'PRD002', category: 'Produce', price: 2.49, cost: 1.20, stock: 40, minStock: 10, unit: 'kg', barcode: '5449000001010', description: 'Fresh red apples', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Chicken Breast 500g', sku: 'MET001', category: 'Meat', price: 6.99, cost: 4.50, stock: 20, minStock: 5, unit: 'pack', barcode: '5449000001011', description: 'Fresh chicken breast', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Ground Beef 500g', sku: 'MET002', category: 'Meat', price: 8.99, cost: 5.80, stock: 15, minStock: 5, unit: 'pack', barcode: '5449000001012', description: 'Premium ground beef', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Frozen Pizza', sku: 'FRZ001', category: 'Frozen', price: 5.99, cost: 3.20, stock: 25, minStock: 8, unit: 'piece', barcode: '5449000001013', description: 'Margherita frozen pizza', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Ice Cream 1L', sku: 'FRZ002', category: 'Frozen', price: 4.99, cost: 2.50, stock: 18, minStock: 5, unit: 'tub', barcode: '5449000001014', description: 'Vanilla ice cream', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Dish Soap 500ml', sku: 'HSH001', category: 'Household', price: 3.49, cost: 1.80, stock: 40, minStock: 10, unit: 'bottle', barcode: '5449000001015', description: 'Dishwashing liquid', image: '', createdAt: now, updatedAt: now, isActive: true },
      { name: 'Paper Towels', sku: 'HSH002', category: 'Household', price: 4.99, cost: 2.50, stock: 5, minStock: 10, unit: 'roll', barcode: '5449000001016', description: 'Premium paper towels 6-pack', image: '', createdAt: now, updatedAt: now, isActive: true },
    ]);
  }

  const saleCount = await db.sales.count();
  if (saleCount === 0) {
    const now = new Date();
    const salesData: Sale[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
      
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const price = parseFloat((Math.random() * 8 + 1).toFixed(2));
        const qty = Math.floor(Math.random() * 3) + 1;
        const total = parseFloat((price * qty).toFixed(2));
        subtotal += total;
        items.push({
          productId: Math.floor(Math.random() * 20) + 1,
          name: `Product ${j + 1}`,
          quantity: qty,
          price,
          discount: 0,
          total
        });
      }
      
      const tax = parseFloat((subtotal * 0.08).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));
      
      salesData.push({
        saleNumber: `SAL-${String(1000 + i).padStart(5, '0')}`,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        discount: 0,
        total,
        paymentMethod: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)] as 'cash' | 'card' | 'mobile',
        amountPaid: total,
        change: 0,
        customerName: '',
        notes: '',
        createdAt: date,
        status: 'completed'
      });
    }
    await db.sales.bulkAdd(salesData);
  }
}
