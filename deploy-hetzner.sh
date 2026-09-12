#!/bin/bash

# Weak Inventory - Hetzner Deployment Script
# Run this on your Hetzner server

set -e

echo "🚀 Weak Inventory - Hetzner Deployment"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/weak-inventory"
DB_NAME="weak_inventory"
DB_USER="weak_user"
DB_PASS=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)

echo -e "${BLUE}Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib nginx nodejs npm

# Install Node.js 20.x if not already installed
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}✓ System dependencies installed${NC}"

echo -e "${BLUE}Step 2: Setting up PostgreSQL database...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo -e "${GREEN}✓ Database created${NC}"

echo -e "${BLUE}Step 3: Setting up application directory...${NC}"
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}

echo -e "${BLUE}Step 4: Deploying backend...${NC}"
cd ${APP_DIR}

# Copy server files
if [ -d "server" ]; then
    echo "Server directory already exists, updating..."
else
    echo "Please copy your server/ directory to ${APP_DIR}/server"
    echo "Then run this script again."
    exit 1
fi

cd server

# Install backend dependencies
npm install --production

# Create .env file
cat > .env <<EOF
DB_USER=${DB_USER}
DB_HOST=localhost
DB_NAME=${DB_NAME}
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SECRET}
PORT=3001
EOF

echo -e "${GREEN}✓ Backend configured${NC}"

echo -e "${BLUE}Step 5: Installing PM2...${NC}"
sudo npm install -g pm2

echo -e "${BLUE}Step 6: Starting backend server...${NC}"
pm2 delete weak-inventory-api 2>/dev/null || true
pm2 start index.js --name weak-inventory-api
pm2 save
pm2 startup -u $USER --hp $HOME

echo -e "${GREEN}✓ Backend running${NC}"

echo -e "${BLUE}Step 7: Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/weak-inventory > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root ${APP_DIR}/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/weak-inventory /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

echo -e "${BLUE}Step 8: Setting up firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}Database Credentials:${NC}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASS}"
echo ""
echo -e "${BLUE}App Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change these credentials!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Build frontend: cd ${APP_DIR} && npm run build"
echo "  2. Copy dist/ to ${APP_DIR}/dist/"
echo "  3. (Optional) Install SSL: sudo certbot --nginx"
echo ""
