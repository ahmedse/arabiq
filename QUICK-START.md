# 🎯 Quick Start Guide - ArabiQ System

## System Status: ✅ PRODUCTION READY

Your ArabiQ system has been fully migrated to Strapi and is ready for deployment!

---

## 📧 1. Email Service (REQUIRED) - 5 minutes

**Recommended:** Resend (3,000 free emails/month)

```bash
# 1. Sign up at https://resend.com
# 2. Get your API key
# 3. Install provider
cd apps/cms
npm install @strapi/provider-email-resend

# 4. Add to apps/cms/.env
echo "RESEND_API_KEY=re_your_key_here" >> .env

# 5. Configure in apps/cms/config/plugins.ts (already done)
# 6. Restart Strapi
```

**See [EMAIL-SETUP-GUIDE.md](EMAIL-SETUP-GUIDE.md) for detailed instructions.**

---

## 🚀 2. Start & Configure Strapi - 10 minutes

```bash
cd apps/cms
pnpm develop

# Visit http://localhost:1337/admin
# 1. Create your first admin account
# 2. Go to Settings → Roles
# 3. Configure permissions for each role:
#    - Public: Read demos, solutions
#    - Potential Customer: Limited demo access
#    - Client: Full demo access
#    - Premium: All features
#    - Admin: Everything
```

---

## 🧪 3. Test the System - 15 minutes

```bash
# Start web app
cd apps/web
pnpm dev

# Visit http://localhost:3000

# Test Flow:
1. Go to /en/register
2. Register a new user
3. Go to Strapi admin → Users
4. Find the new user, change accountStatus to 'active'
5. Go back to web app and login
6. Try to access /en/demos
7. Should see demo content!

# Test Admin:
1. Login with your admin account
2. Go to /en/admin/users
3. Try elevating a user's role
4. Grant demo access to a user
```

---

## 📝 4. Add Content - 30 minutes

```bash
# In Strapi admin (http://localhost:1337/admin):

# Content Manager → Create entries for:
- Site Settings (title, footer text, etc.)
- Navigation Items (header/footer links)
- Demos (add 1-2 demos with titles, descriptions)
- Solutions (optional)
- Case Studies (optional)
- Industries (optional)
```

---

## 🌐 5. Deploy to Production

### Option A: Quick Deploy (Recommended for testing)

**Strapi + Database:** Railway.app
```bash
# 1. Push to GitHub
# 2. Go to railway.app → New Project → Deploy from GitHub
# 3. Select your repo
# 4. Add PostgreSQL service
# 5. Set environment variables (see below)
# 6. Deploy
```

**Next.js Web:** Vercel
```bash
# 1. Go to vercel.com → New Project
# 2. Import from GitHub
# 3. Set root directory: apps/web
# 4. Add environment variables (see below)
# 5. Deploy
```

### Option B: Self-Hosted

See [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md) Section 8 for detailed deployment instructions.

---

## 🔑 Required Environment Variables

### Strapi CMS (`.env`):
```bash
# Database (from Railway/Render/your provider)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security (GENERATE THESE!)
APP_KEYS=app-key-1,app-key-2
API_TOKEN_SALT=random-string-32-chars
ADMIN_JWT_SECRET=random-string-32-chars
JWT_SECRET=random-string-32-chars

# Email
RESEND_API_KEY=re_your_key_here

# Server
HOST=0.0.0.0
PORT=1337
```

**Generate Random Secrets:**
```bash
# Run this 4 times for 4 different secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Next.js Web (`.env.local`):
```bash
# Strapi URL (update to your production URL)
NEXT_PUBLIC_STRAPI_URL=https://your-cms.railway.app
STRAPI_URL=https://your-cms.railway.app

# Strapi API Token (generate in Strapi admin)
STRAPI_API_TOKEN=your-api-token
```

**Get STRAPI_API_TOKEN:**
1. Strapi admin → Settings → API Tokens
2. Create new token (type: Read-Only or Full Access)
3. Copy the token

---

## ✅ Verification Checklist

Before going live:

- [ ] Email service configured (Resend)
- [ ] First admin user created
- [ ] Roles & permissions configured
- [ ] Test user registered and activated
- [ ] Test login/logout works
- [ ] Test demo access works
- [ ] Test admin panel works
- [ ] Content added (at least 2-3 demos)
- [ ] Production environment variables set
- [ ] Database deployed
- [ ] Strapi deployed
- [ ] Web app deployed
- [ ] DNS configured (optional)
- [ ] HTTPS enabled

---

## 📚 Additional Resources

- **Comprehensive Audit:** [FINAL-AUDIT-REPORT.md](FINAL-AUDIT-REPORT.md) - Full system documentation
- **Email Setup:** [EMAIL-SETUP-GUIDE.md](EMAIL-SETUP-GUIDE.md) - Detailed email configuration
- **Original Tasks:** [TASKS.md](TASKS.md) - Migration task list

---

## 🆘 Common Issues

### Issue: Can't login after registration
**Solution:** Check Strapi admin → Users → Set accountStatus to 'active'

### Issue: Demos not loading
**Solution:** 
1. Check Strapi is running
2. Verify NEXT_PUBLIC_STRAPI_URL is set correctly
3. Check STRAPI_API_TOKEN is valid

### Issue: Email not sending
**Solution:**
1. Verify RESEND_API_KEY in .env
2. Check Resend dashboard for errors
3. Verify email provider is configured in plugins.ts

### Issue: 403 Forbidden errors
**Solution:** Configure permissions in Strapi admin → Settings → Roles

---

## 🎉 You're Ready!

The system is fully functional and production-ready. Follow the steps above to:
1. Set up email (5 min)
2. Configure Strapi (10 min)
3. Test everything (15 min)
4. Add content (30 min)
5. Deploy (1-2 hours)

**Total time to production: 2-4 hours**

Good luck! 🚀
