const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'weak_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'weak_inventory',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Initialize database
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

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin user if not exists
    const userCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (userCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await client.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['admin', passwordHash]);
      console.log('Default admin user created (username: admin, password: admin123)');
    }

    // Seed initial data if empty
    const categoryCount = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoryCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categories (name, color, icon) VALUES
        ('Beverages', '#3B82F6', '🥤'),
        ('Snacks', '#F59E0B', '🍿'),
        ('Dairy', '#10B981', '🥛'),
        ('Bakery', '#F97316', '🍞'),
        ('Produce', '#22C55E', '🥬'),
        ('Meat', '#EF4444', '🥩'),
        ('Frozen', '#6366F1', '🧊'),
        ('Household', '#8B5CF6', '🏠')
      `);
      console.log('Categories seeded');
    }

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  try {
    const { name, sku, category, price, cost, stock, min_stock, unit, barcode, description } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (name, sku, category, price, cost, stock, min_stock, unit, barcode, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, sku, category, price, cost, stock || 0, min_stock || 10, unit, barcode, description]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, price, cost, stock, min_stock, unit, barcode, description } = req.body;
    
    const result = await pool.query(
      `UPDATE products SET name=$1, sku=$2, category=$3, price=$4, cost=$5, stock=$6, 
       min_stock=$7, unit=$8, barcode=$9, description=$10, updated_at=CURRENT_TIMESTAMP 
       WHERE id=$11 RETURNING *`,
      [name, sku, category, price, cost, stock, min_stock, unit, barcode, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales API
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await pool.query('SELECT * FROM sales ORDER BY created_at DESC LIMIT 1000');
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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { sale_number, items, subtotal, tax, discount, total, payment_method, amount_paid, change, customer_name, notes } = req.body;
    
    // Insert sale
    const saleResult = await client.query(
      `INSERT INTO sales (sale_number, subtotal, tax, discount, total, payment_method, amount_paid, change_amount, customer_name, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [sale_number, subtotal, tax, discount || 0, total, payment_method, amount_paid, change || 0, customer_name, notes]
    );
    
    const saleId = saleResult.rows[0].id;
    
    // Insert sale items and update stock
    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, name, quantity, price, discount, total) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [saleId, item.productId, item.name, item.quantity, item.price, item.discount || 0, item.total]
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
  try {
    const { name, color, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, color, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, color, icon]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalSales = await pool.query('SELECT COUNT(*) FROM sales WHERE status = $1', ['completed']);
    const totalRevenue = await pool.query('SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE status = $1', ['completed']);
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    const lowStock = await pool.query('SELECT COUNT(*) FROM products WHERE stock <= min_stock AND is_active = true');
    
    res.json({
      totalSales: parseInt(totalSales.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      totalProducts: parseInt(totalProducts.rows[0].count),
      lowStockItems: parseInt(lowStock.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`\n🚀 Weak Inventory API Server`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`\n📋 Default credentials:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
  console.log(`\n⚠️  Change these credentials in production!\n`);
  
  await initDatabase();
});

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
