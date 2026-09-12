import { db } from '../db/database';
import { api } from './api';
import { Product, Sale, Category } from '../types';

// Check if we should use remote API or local IndexedDB
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_DB === 'true';

export const databaseService = {
  isRemote: USE_REMOTE,

  // Products
  async getProducts(): Promise<Product[]> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.getProducts();
      } catch (err) {
        console.error('Failed to fetch products from API, falling back to local:', err);
      }
    }
    return await db.products.where('isActive').equals(1).toArray();
  },

  async getAllProducts(): Promise<Product[]> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.getProducts();
      } catch (err) {
        console.error('Failed to fetch products from API, falling back to local:', err);
      }
    }
    return await db.products.toArray();
  },

  async createProduct(product: Product): Promise<Product> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.createProduct(product);
      } catch (err) {
        console.error('Failed to create product via API:', err);
        throw err;
      }
    }
    const id = await db.products.add(product);
    return { ...product, id };
  },

  async updateProduct(id: number, product: Partial<Product>): Promise<void> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        await api.updateProduct(id, product);
        return;
      } catch (err) {
        console.error('Failed to update product via API:', err);
        throw err;
      }
    }
    await db.products.update(id, product);
  },

  async deleteProduct(id: number): Promise<void> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        await api.deleteProduct(id);
        return;
      } catch (err) {
        console.error('Failed to delete product via API:', err);
        throw err;
      }
    }
    await db.products.delete(id);
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.getSales();
      } catch (err) {
        console.error('Failed to fetch sales from API, falling back to local:', err);
      }
    }
    return await db.sales.toArray();
  },

  async createSale(sale: Sale): Promise<Sale> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.createSale(sale);
      } catch (err) {
        console.error('Failed to create sale via API:', err);
        throw err;
      }
    }
    
    const id = await db.sales.add(sale);
    
    // Update stock locally
    for (const item of sale.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: product.stock - item.quantity,
          updatedAt: new Date(),
        });
      }
    }
    
    return { ...sale, id };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.getCategories();
      } catch (err) {
        console.error('Failed to fetch categories from API, falling back to local:', err);
      }
    }
    return await db.categories.toArray();
  },

  async createCategory(category: Category): Promise<Category> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        return await api.createCategory(category);
      } catch (err) {
        console.error('Failed to create category via API:', err);
        throw err;
      }
    }
    const id = await db.categories.add(category);
    return { ...category, id };
  },

  async deleteCategory(id: number): Promise<void> {
    if (USE_REMOTE && api.isAuthenticated()) {
      try {
        await api.deleteCategory(id);
        return;
      } catch (err) {
        console.error('Failed to delete category via API:', err);
        throw err;
      }
    }
    await db.categories.delete(id);
  },
};
