export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Sale {
  id?: number;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  amountPaid: number;
  change: number;
  customerName: string;
  notes: string;
  createdAt: Date;
  status: 'completed' | 'voided' | 'refunded';
}

export interface SaleItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}
