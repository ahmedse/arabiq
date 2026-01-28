# ✅ Email Service Setup Complete!

**Date:** January 28, 2026  
**Service:** Resend  
**Status:** ✅ Configured

---

## What Was Done

### 1. ✅ API Key Added
- **Location:** `/apps/cms/.env`
- **Variable:** `RESEND_API_KEY=re_2UbbvCFx_awJSMSUn8H9wbD1RD5iqucPG`

### 2. ✅ Provider Installed
```bash
pnpm install @strapi/provider-email-nodemailer resend
```

**Packages Added:**
- `@strapi/provider-email-nodemailer@5.33.4`
- `resend@6.9.1`

### 3. ✅ Email Configured
- **File:** `/apps/cms/config/plugins.ts`
- **Provider:** Nodemailer with Resend SMTP
- **SMTP Settings:**
  - Host: `smtp.resend.com`
  - Port: `465` (secure)
  - Auth: `resend` / API key

### 4. ✅ Default Addresses Set
- **From:** `noreply@yourdomain.com`
- **Reply-To:** `support@yourdomain.com`

---

## 🚀 Next Steps

### 1. Start Strapi (Required)
```bash
cd apps/cms
pnpm develop
```

**Then:**
- Visit http://localhost:1337/admin
- Create your first admin account (if not done yet)

### 2. Update Email Addresses (Recommended)
Once you have a verified domain in Resend:

Edit `/apps/cms/config/plugins.ts`:
```typescript
settings: {
  defaultFrom: 'noreply@yourdomain.com',  // Change this
  defaultReplyTo: 'support@yourdomain.com',  // Change this
},
```

### 3. Verify Domain in Resend (For Production)
1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain

**For Testing:** You can use Resend's test domain initially.

### 4. Enable Email Confirmation (Optional)
In Strapi admin:
- Settings → Users & Permissions → Advanced Settings
- Enable "Email confirmation"

### 5. Test Email Sending
**Option A: Test Password Reset**
```bash
cd apps/web
pnpm dev
# Visit http://localhost:3000/en/forgot-password
# Enter a test email
# Check Resend dashboard for sent email
```

**Option B: Test from Strapi Admin**
1. Strapi admin → Settings → Users & Permissions
2. Email Templates → Click "Send test email"

---

## 📧 How It Works

### Registration Flow:
1. User registers at `/en/register`
2. Strapi creates user account (status: pending)
3. If email confirmation enabled → Email sent via Resend
4. User clicks confirmation link
5. Account activated

### Password Reset Flow:
1. User visits `/en/forgot-password`
2. Enters email address
3. Strapi generates reset token
4. Email sent via Resend with reset link
5. User clicks link → redirected to `/en/reset-password?code=TOKEN`
6. User sets new password

---

## 🔍 Troubleshooting

### Issue: Emails not sending
**Check:**
1. Is RESEND_API_KEY correct in `.env`?
2. Is Strapi restarted after adding the key?
3. Check Strapi logs for errors
4. Check Resend dashboard → Logs

### Issue: Emails go to spam
**Solution:**
1. Verify domain in Resend
2. Add SPF, DKIM, DMARC DNS records
3. Use verified domain in `defaultFrom`

### Issue: "Invalid API key" error
**Solution:**
1. Verify API key is correct (starts with `re_`)
2. Check for extra spaces in `.env` file
3. Restart Strapi completely

---

## 📊 Resend Dashboard

**View Sent Emails:**
- Dashboard: https://resend.com/emails
- Logs show delivery status, opens, clicks

**Current Limits:**
- **Free Tier:** 3,000 emails/month (100/day)
- **Emails sent today:** Check dashboard

---

## ⚙️ Configuration Summary

### Environment Variables (`/apps/cms/.env`):
```bash
RESEND_API_KEY=re_2UbbvCFx_awJSMSUn8H9wbD1RD5iqucPG
```

### Email Config (`/apps/cms/config/plugins.ts`):
```typescript
email: {
  config: {
    provider: 'nodemailer',
    providerOptions: {
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: env('RESEND_API_KEY'),
      },
    },
    settings: {
      defaultFrom: 'noreply@yourdomain.com',
      defaultReplyTo: 'support@yourdomain.com',
    },
  },
}
```

---

## ✅ Status Check

- ✅ API key added to environment
- ✅ Email provider installed
- ✅ Plugin configured
- ✅ SMTP settings correct
- ⏸️ **Waiting:** Strapi restart to apply changes
- ⏸️ **Pending:** Email domain verification (for production)

---

## 🎯 What's Next?

**From [QUICK-START.md](QUICK-START.md):**

1. ✅ **Email service** - DONE!
2. **Start Strapi** - Run `cd apps/cms && pnpm develop`
3. **Create admin** - Visit http://localhost:1337/admin
4. **Configure roles** - Settings → Roles
5. **Test registration** - Create test user
6. **Add content** - Add demos in Strapi
7. **Deploy** - Follow deployment guide

---

**Email service is ready!** Start Strapi to test it. 🚀
