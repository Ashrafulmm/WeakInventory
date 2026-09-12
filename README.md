# 🏪 Weak Inventory - POS & Inventory Management

A complete Point of Sale system with inventory management, built with React, TypeScript, and Tailwind CSS. Supports both **local browser storage** (IndexedDB) and **remote database** (PostgreSQL) deployment options.

![Weak Inventory](https://img.shields.io/badge/Weak-Inventory-blue) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-blue)

---

## ✨ Features

- **📊 Dashboard** - Real-time stats, revenue charts, low stock alerts
- **🛒 Point of Sale** - Fast checkout with multiple payment methods
- **➕ Add Sales** - Create sales directly from inventory
- **📦 Inventory** - Full product management with CRUD operations
- **📜 Sales History** - View all transactions with detailed receipts
- **📈 Statistical Reports** - Revenue trends, hourly patterns, top sellers
- **⚙️ Settings** - Store config, categories, database management

---

## 🚀 Hosting Options

### Option 1: Vercel (Frontend Only)
**Best for:** Personal use, single device, quick deployment

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/weak-inventory.git
git push -u origin main

# 2. Go to vercel.com and import your repo
# 3. Deploy! (automatic)
```

**Result:**
- ✅ Live at `your-app.vercel.app`
- ✅ Free HTTPS & CDN
- ❌ Data stored in browser only (IndexedDB)
- ❌ No sync between devices

---

### Option 2: Hetzner Server (Full Stack)
**Best for:** Multi-device, team access, data persistence

#### Quick Setup:

```bash
# 1. SSH into your Hetzner server
ssh root@your-server-ip

# 2. Clone the repository
git clone https://github.com/yourusername/weak-inventory.git
cd weak-inventory

# 3. Run deployment script
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh

# 4. Build frontend
npm install
npm run build

# 5. (Optional) Add SSL
sudo certbot --nginx -d yourdomain.com
```

**Result:**
- ✅ PostgreSQL database
- ✅ Multi-device sync
- ✅ Team access with authentication
- ✅ Full data persistence
- ✅ Custom domain support

---

### Option 3: Hybrid (Offline + Cloud Sync)
**Best for:** Offline capability with cloud backup

Set environment variable:
```env
VITE_USE_REMOTE_DB=true
VITE_API_URL=https://api.yourdomain.com/api
```

The app will use IndexedDB locally and sync to PostgreSQL when online.

---

## 📁 Project Structure

```
weak-inventory/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with sidebar
│   │   ├── Dashboard.tsx       # Dashboard with charts
│   │   ├── POS.tsx             # Point of Sale
│   │   ├── AddSales.tsx        # Add Sales from inventory
│   │   ├── Inventory.tsx       # Inventory management
│   │   ├── SalesHistory.tsx    # Sales history
│   │   ├── StatisticalReport.tsx # Reports
│   │   ├── Settings.tsx        # Settings
│   │   └── Login.tsx           # Login screen
│   ├── db/
│   │   └── database.ts         # IndexedDB setup
│   ├── services/
│   │   ├── api.ts              # API client
│   │   └── database.ts         # Database service (local/remote)
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Main app
│   └── main.tsx                # Entry point
├── server/
│   ├── index.js                # Express API server
│   ├── package.json            # Backend dependencies
│   └── .env.example            # Environment template
├── .env                        # Local dev config
├── .env.production             # Production config
├── deploy-hetzner.sh           # Hetzner deployment script
├── vercel.json                 # Vercel config
└── HOSTING_GUIDE.md            # Detailed hosting guide
```

---

## 🔧 Configuration

### Local Development (IndexedDB)

`.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_REMOTE_DB=false
```

### Production with Hetzner (PostgreSQL)

`.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_USE_REMOTE_DB=true
```

### Backend Server

`server/.env`:
```env
DB_USER=weak_user
DB_HOST=localhost
DB_NAME=weak_inventory
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

---

## 🗄️ Database Setup (Hetzner)

### Manual Setup:

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE weak_inventory;
CREATE USER weak_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE weak_inventory TO weak_user;
\q

# Tables are auto-created on first API run
```

### Tables:
- `categories` - Product categories
- `products` - Inventory items
- `sales` - Sales transactions
- `sale_items` - Items in each sale
- `users` - Authentication users

---

## 🔐 Authentication

Default credentials (change in production!):
- **Username:** `admin`
- **Password:** `admin123`

The backend uses JWT tokens stored in localStorage.

---

## 📊 API Endpoints

### Auth
- `POST /api/auth/login` - Login

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Stats
- `GET /api/stats` - Dashboard statistics

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 Deployment

### Vercel
```bash
# Push to GitHub, then import in Vercel dashboard
# Or use CLI:
npm i -g vercel
vercel
```

### Hetzner
```bash
# On your server:
./deploy-hetzner.sh

# Or manually:
cd server
npm install
pm2 start index.js --name weak-inventory-api
```

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation

**Production Checklist:**
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall (UFW)
- [ ] Set up database backups
- [ ] Monitor logs

---

## 💾 Backups

```bash
# Backup PostgreSQL
pg_dump weak_inventory > backup_$(date +%Y%m%d).sql

# Restore
psql weak_inventory < backup_20240101.sql

# Automated daily backup (cron)
0 2 * * * pg_dump weak_inventory > /backups/weak_inventory_$(date +\%Y\%m\%d).sql
```

---

## 📈 Monitoring

```bash
# PM2 monitoring
pm2 status
pm2 logs weak-inventory-api
pm2 monit

# Database stats
psql weak_inventory -c "SELECT COUNT(*) FROM sales;"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🆘 Support

For issues and questions:
- Check [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) for detailed deployment instructions
- Open an issue on GitHub
- Review the code comments

---

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Receipt printing
- [ ] Barcode scanner integration
- [ ] Customer management
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Email notifications
- [ ] SMS alerts for low stock

---

**Built with ❤️ for small businesses**
