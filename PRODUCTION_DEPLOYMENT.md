# Production Deployment Guide

> **Last Updated**: 2026-02-02  
> **Platform Version**: Phase 2 Complete  
> **Status**: Production Ready ✅

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Node.js** 20+
- **PostgreSQL** 14+
- **pnpm** 8+
- **Domain** configured with DNS
- **SSL Certificate** (Let's Encrypt recommended)

### Recommended
- **Reverse Proxy**: Nginx or Caddy
- **Process Manager**: PM2 or systemd
- **Redis**: For distributed rate limiting (optional)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Users                               │
│                       ↓                                 │
│                  HTTPS (443)                            │
│                       ↓                                 │
│              Nginx/Caddy Reverse Proxy                  │
│            ┌──────────┴──────────┐                      │
│            ↓                     ↓                       │
│    Next.js Web App          Strapi CMS                  │
│      (Port 3000)              (Port 1337)               │
│            │                     │                       │
│            └──────────┬──────────┘                      │
│                       ↓                                 │
│                  PostgreSQL                             │
│                  (Port 5432)                            │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### 1. CMS Environment (`apps/cms/.env`)

```bash
# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=generate_with_openssl_rand_base64_32
API_TOKEN_SALT=generate_with_openssl_rand_base64_32
ADMIN_JWT_SECRET=generate_with_openssl_rand_base64_32
TRANSFER_TOKEN_SALT=generate_with_openssl_rand_base64_32
JWT_SECRET=generate_with_openssl_rand_base64_32

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=arabiq
DATABASE_USERNAME=arabiq
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=false

# URLs
CLIENT_URL=https://arabiq.tech
CORS_ORIGIN=https://arabiq.tech

# Email (if using Strapi email plugin)
# EMAIL_PROVIDER=resend
# EMAIL_PROVIDER_API_KEY=your_resend_key

# Production Mode
NODE_ENV=production
```

### 2. Web Environment (`apps/web/.env.production`)

See `apps/web/.env.production.example` for complete template:

```bash
# Required
STRAPI_URL=https://cms.arabiq.tech
STRAPI_API_TOKEN=your_production_token
SITE_URL=https://arabiq.tech
NODE_ENV=production

# Email
RESEND_API_KEY=re_your_resend_api_key
ADMIN_EMAIL=admin@arabiq.tech

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

---

## Deployment Options

### Option 1: VPS Deployment (Recommended)

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### Step 2: Database Setup

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE arabiq;
CREATE USER arabiq WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE arabiq TO arabiq;
\q
```

#### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-org/arabiq.git
cd arabiq

# Install dependencies
pnpm install

# Configure environment
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.production.example apps/web/.env.production
# Edit both files with production values

# Build CMS
cd apps/cms
pnpm build

# Build Web
cd ../web
pnpm build
```

#### Step 4: Start with PM2

```bash
# Start CMS
cd /var/www/arabiq/apps/cms
pm2 start npm --name "arabiq-cms" -- start

# Start Web
cd /var/www/arabiq/apps/web
pm2 start npm --name "arabiq-web" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Step 5: Configure Nginx

```nginx
# /etc/nginx/sites-available/arabiq

# Main website
server {
    listen 80;
    server_name arabiq.tech www.arabiq.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name arabiq.tech www.arabiq.tech;

    ssl_certificate /etc/letsencrypt/live/arabiq.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arabiq.tech/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# CMS subdomain
server {
    listen 80;
    server_name cms.arabiq.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cms.arabiq.tech;

    ssl_certificate /etc/letsencrypt/live/cms.arabiq.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.arabiq.tech/privkey.pem;

    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/arabiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificates
sudo certbot --nginx -d arabiq.tech -d www.arabiq.tech
sudo certbot --nginx -d cms.arabiq.tech
```

---

### Option 2: Docker Deployment

Use existing Docker configuration in repository. Update docker-compose.yml for production:

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

---

### Option 3: Vercel/Netlify (Web Only)

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from apps/web
cd apps/web
vercel --prod
```

**Environment Variables in Vercel Dashboard:**
- Add all variables from `.env.production.example`
- Ensure `STRAPI_URL` points to your deployed CMS

#### Note
Vercel/Netlify can only host the Next.js web app. You still need to deploy Strapi CMS separately (VPS or DigitalOcean App Platform).

---

## Post-Deployment

### 1. Verify Deployment Checklist

- [ ] Visit https://arabiq.tech - Homepage loads
- [ ] Visit https://cms.arabiq.tech/admin - CMS admin accessible
- [ ] Test language switching (EN/AR)
- [ ] Test contact form submission
- [ ] Verify all static pages render
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit (target 90+ scores)

### 2. Initial Content Setup

```bash
# Seed CMS content (if needed)
cd /var/www/arabiq/seed
pnpm install
node seed.js
```

### 3. Create Admin User

1. Visit `https://cms.arabiq.tech/admin`
2. Create first admin account
3. Log in and verify access

### 4. Configure SMTP (Resend)

1. Get API key from https://resend.com
2. Add to web `.env.production`: `RESEND_API_KEY=re_...`
3. Add sender email: `ADMIN_EMAIL=admin@arabiq.tech`
4. Test contact form

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs arabiq-web
pm2 logs arabiq-cms

# Restart services
pm2 restart arabiq-web
pm2 restart arabiq-cms

# Monitor resources
pm2 monit
```

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/arabiq"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U arabiq arabiq > "$BACKUP_DIR/arabiq_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "arabiq_*.sql" -mtime +7 -delete
```

Add to crontab: `0 2 * * * /usr/local/bin/backup-arabiq.sh`

### Log Rotation

```bash
# /etc/logrotate.d/arabiq
/var/www/arabiq/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
}
```

### SSL Certificate Renewal

Certbot auto-renews. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Issue: Pages return 500 errors

**Check:**
- CMS is running: `pm2 status`
- Database is accessible: `psql -U arabiq -d arabiq -h localhost`
- Environment variables are set correctly
- Check logs: `pm2 logs arabiq-cms`

### Issue: Contact form doesn't send emails

**Check:**
- `RESEND_API_KEY` is set in web `.env.production`
- API key is valid (test in Resend dashboard)
- Check web logs: `pm2 logs arabiq-web`

### Issue: Images don't load

**Check:**
- Strapi media folder permissions: `chmod -R 755 apps/cms/public/uploads`
- CORS settings in CMS `.env`: `CORS_ORIGIN=https://arabiq.tech`
- Check browser network tab for blocked requests

### Issue: Arabic (RTL) layout broken

**Check:**
- Tailwind CSS compiled correctly: `pnpm build`
- Browser cache cleared
- Check for CSS conflicts in dev tools

### Issue: High memory usage

**Solutions:**
- Enable Redis for caching (optional)
- Increase server memory
- Optimize images in CMS
- Enable Next.js image optimization

---

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (UFW): Allow 80, 443, 22 only
- [ ] Database not exposed to internet (bind to 127.0.0.1)
- [ ] Strong passwords for database and CMS admin
- [ ] Environment files not committed to git
- [ ] Rate limiting enabled (Upstash Redis recommended for production)
- [ ] Security headers configured in Nginx
- [ ] Regular backups automated
- [ ] Fail2ban installed for SSH protection
- [ ] Keep dependencies updated: `pnpm update`

---

## Performance Checklist

- [ ] Next.js image optimization enabled
- [ ] Gzip/Brotli compression in Nginx
- [ ] CDN configured (Cloudflare recommended)
- [ ] Database indexes created
- [ ] PM2 cluster mode for multiple CPU cores
- [ ] ISR caching configured (already set)
- [ ] Font preloading enabled (already set)
- [ ] Lazy loading for below-fold content (already set)

---

## Update Procedure

```bash
# 1. Pull latest changes
cd /var/www/arabiq
git pull origin main

# 2. Install dependencies
pnpm install

# 3. Build applications
cd apps/cms && pnpm build
cd ../web && pnpm build

# 4. Restart services
pm2 restart arabiq-cms
pm2 restart arabiq-web

# 5. Verify
pm2 status
curl -I https://arabiq.tech
```

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Issue Tracker**: GitHub Issues
- **CMS Admin**: https://cms.arabiq.tech/admin
- **Status Page**: (Configure UptimeRobot or similar)

---

## Next Phase

**Phase 3: VTour Demo Experiences**
- Deploy 6 interactive Matterport demos
- AI Chatbot integration
- Booking systems within virtual tours

See `/docs/VTOUR-DEMO-PLAN.md` for details.