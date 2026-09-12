# Weak Inventory - Hosting Guide

## Current Architecture
The app currently uses **IndexedDB** (via Dexie.js) for local browser storage. This works great for single-device use but doesn't sync across devices or persist if the browser cache is cleared.

## Hosting Options

### Option 1: Vercel (Frontend Only - Still Uses IndexedDB)
**Best for:** Quick deployment, personal use, single device
**Database:** Browser IndexedDB (local to each browser)

### Option 2: Hetzner Server (Full Stack with Real Database)
**Best for:** Multi-device sync, team use, data persistence
**Database:** PostgreSQL/MySQL on your server

### Option 3: Hybrid (Both Local + Remote Sync)
**Best for:** Offline capability + cloud sync
**Database:** IndexedDB locally + PostgreSQL remotely

---

## 🚀 Option 1: Deploy to Vercel (Simple)

### Steps:
1. Push code to GitHub
2. Go to vercel.com and import your repo
3. Deploy (it's automatic!)

### What you get:
- ✅ Hosted at `your-app.vercel.app`
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ❌ Data stays in browser (IndexedDB)
- ❌ No sync between devices

---

## 🖥️ Option 2: Hetzner Server with Database

### Step 1: Set up Hetzner Server

```bash
# SSH into your Hetzner server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE weak_inventory;
CREATE USER weak_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE weak_inventory TO weak_user;
\q
```

### Step 2: Install Backend Dependencies

```bash
# On your Hetzner server
mkdir -p /var/www/weak-inventory
cd /var/www/weak-inventory

# Clone your repo
git clone https://github.com/your-username/weak-inventory.git .

# Install dependencies
npm install
npm install express cors pg dotenv bcryptjs jsonwebtoken
```

### Step 3: Create Backend API

Create `server/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'weak_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'weak_inventory',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Create tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20),
        icon VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        unit VARCHAR(20),
        barcode VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        sale_number VARCHAR(50) UNIQUE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        change_amount DECIMAL(10,2) DEFAULT 0,
        customer_name VARCHAR(255),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(5,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL
      );
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple auth (in production, use proper user management)
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Products API
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, sku, category, price, cost, stock, min_stock, unit, barcode, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, sku, category, price, cost, stock, min_stock, unit, barcode, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, sku, category, price, cost, stock, min_stock, unit, barcode, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, sku, category, price, cost, stock, min_stock, unit, barcode, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, sku=$2, category=$3, price=$4, cost=$5, stock=$6, min_stock=$7, unit=$8, barcode=$9, description=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *',
      [name, sku, category, price, cost, stock, min_stock, unit, barcode, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales API
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await pool.query('SELECT * FROM sales ORDER BY created_at DESC');
    const items = await pool.query('SELECT * FROM sale_items');
    
    const salesWithItems = sales.rows.map(sale => ({
      ...sale,
      items: items.rows.filter(item => item.sale_id === sale.id)
    }));
    
    res.json(salesWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  const { sale_number, items, subtotal, tax, discount, total, payment_method, amount_paid, change, customer_name, notes } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert sale
    const saleResult = await client.query(
      'INSERT INTO sales (sale_number, subtotal, tax, discount, total, payment_method, amount_paid, change_amount, customer_name, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [sale_number, subtotal, tax, discount, total, payment_method, amount_paid, change, customer_name, notes]
    );
    
    const saleId = saleResult.rows[0].id;
    
    // Insert sale items
    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, name, quantity, price, discount, total) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [saleId, item.productId, item.name, item.quantity, item.price, item.discount, item.total]
      );
      
      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.productId]
      );
    }
    
    await client.query('COMMIT');
    res.json(saleResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Categories API
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, color, icon } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, color, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, color, icon]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Create Environment File

Create `server/.env`:

```env
DB_USER=weak_user
DB_HOST=localhost
DB_NAME=weak_inventory
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3001
```

### Step 5: Update Frontend to Use API

Create `src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async createProduct(product: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: number) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales
  async getSales() {
    return this.request('/sales');
  }

  async createSale(sale: any) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(category: any) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }
}

export const api = new ApiService();
```

### Step 6: Update Database Service

Create `src/services/database.ts`:

```typescript
import { db } from '../db/database';
import { api } from './api';
import { Product, Sale, Category } from '../types';

// Check if we should use remote API or local IndexedDB
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_DB === 'true';

export const databaseService = {
  // Products
  async getProducts(): Promise<Product[]> {
    if (USE_REMOTE) {
      return await api.getProducts();
    }
    return await db.products.where('isActive').equals(1).toArray();
  },

  async createProduct(product: Product): Promise<Product> {
    if (USE_REMOTE) {
      return await api.createProduct(product);
    }
    const id = await db.products.add(product);
    return { ...product, id };
  },

  async updateProduct(id: number, product: Partial<Product>): Promise<void> {
    if (USE_REMOTE) {
      await api.updateProduct(id, product);
    } else {
      await db.products.update(id, product);
    }
  },

  async deleteProduct(id: number): Promise<void> {
    if (USE_REMOTE) {
      await api.deleteProduct(id);
    } else {
      await db.products.delete(id);
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (USE_REMOTE) {
      return await api.getSales();
    }
    return await db.sales.toArray();
  },

  async createSale(sale: Sale): Promise<Sale> {
    if (USE_REMOTE) {
      return await api.createSale(sale);
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
    if (USE_REMOTE) {
      return await api.getCategories();
    }
    return await db.categories.toArray();
  },

  async createCategory(category: Category): Promise<Category> {
    if (USE_REMOTE) {
      return await api.createCategory(category);
    }
    const id = await db.categories.add(category);
    return { ...category, id };
  },
};
```

### Step 7: Create Environment Files

Create `.env` (for local development):

```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_REMOTE_DB=false
```

Create `.env.production` (for production with Hetzner):

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_USE_REMOTE_DB=true
```

### Step 8: Deploy Backend to Hetzner

```bash
# On your Hetzner server
cd /var/www/weak-inventory/server

# Install PM2 for process management
npm install -g pm2

# Start the server
pm2 start index.js --name weak-inventory-api

# Save PM2 config
pm2 save
pm2 startup
```

### Step 9: Set up Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/weak-inventory
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (Vercel or static files)
    location / {
        root /var/www/weak-inventory/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/weak-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔄 Option 3: Hybrid Mode (Offline + Sync)

For offline-first with cloud sync, you can use both IndexedDB and remote database:

```typescript
// src/services/sync.ts
import { db } from '../db/database';
import { api } from './api';

export async function syncToCloud() {
  // Get unsynced records
  const unsyncedSales = await db.sales.where('synced').equals(0).toArray();
  
  for (const sale of unsyncedSales) {
    try {
      await api.createSale(sale);
      await db.sales.update(sale.id!, { synced: 1 });
    } catch (err) {
      console.error('Failed to sync sale:', err);
    }
  }
}

// Run sync every 5 minutes
setInterval(syncToCloud, 5 * 60 * 1000);
```

---

## 📋 Deployment Checklist

### For Vercel:
- [ ] Push code to GitHub
- [ ] Import repo in Vercel
- [ ] Deploy (automatic)
- [ ] Data stored in browser IndexedDB

### For Hetzner:
- [ ] Set up PostgreSQL database
- [ ] Create backend API server
- [ ] Configure environment variables
- [ ] Set up PM2 for process management
- [ ] Configure Nginx reverse proxy
- [ ] Install SSL certificate
- [ ] Update frontend `.env.production`
- [ ] Build and deploy frontend
- [ ] Test API endpoints

---

## 🔐 Security Notes

1. **Change default credentials** in `server/index.js`
2. **Use strong passwords** for database and JWT secret
3. **Enable HTTPS** with Let's Encrypt
4. **Set up firewall** (UFW) on Hetzner
5. **Regular backups** of PostgreSQL database
6. **Monitor logs** with PM2

```bash
# UFW Firewall setup
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 💾 Database Backup

```bash
# Backup PostgreSQL
pg_dump weak_inventory > backup_$(date +%Y%m%d).sql

# Restore
psql weak_inventory < backup_20240101.sql
```

---

## 📊 Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs weak-inventory-api

# Monitor resources
pm2 monit
```

---

## 🎯 Summary

| Feature | Vercel | Hetzner |
|---------|--------|---------|
| Cost | Free | ~$5-10/month |
| Setup Time | 5 minutes | 1-2 hours |
| Multi-device | ❌ | ✅ |
| Data Persistence | Browser only | Server database |
| Team Access | ❌ | ✅ |
| Offline Support | ✅ | ✅ (with hybrid) |
| Scalability | Limited | Full control |

**Recommendation:**
- Start with **Vercel** for testing/personal use
- Move to **Hetzner** when you need multi-device sync or team access
- Use **Hybrid mode** if you need offline capability + cloud sync
