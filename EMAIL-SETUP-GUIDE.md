# 📧 Email Service Setup Guide

## Recommended: Resend (Best Free Option)

### Why Resend?
- **3,000 emails/month FREE** (100 per day)
- No credit card required
- Modern, simple API
- Perfect for Strapi
- Excellent deliverability

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Sign Up
1. Go to https://resend.com
2. Sign up with your email
3. Verify your email

### Step 2: Get API Key
1. Dashboard → API Keys
2. Click "Create API Key"
3. Name it: "ArabiQ Production"
4. Copy the key (starts with `re_...`)

### Step 3: Add Domain (Optional but Recommended)
1. Dashboard → Domains
2. Add your domain: `yourdomain.com`
3. Add DNS records (TXT, MX, CNAME)
4. Verify domain

**For testing, you can use Resend's test domain initially**

### Step 4: Install Strapi Email Provider
```bash
cd apps/cms
npm install @strapi/provider-email-resend
```

### Step 5: Configure Strapi
Edit `/apps/cms/config/plugins.ts`:

```typescript
export default () => ({
  email: {
    config: {
      provider: 'resend',
      providerOptions: {
        apiKey: process.env.RESEND_API_KEY,
      },
      settings: {
        defaultFrom: 'noreply@yourdomain.com',
        defaultReplyTo: 'support@yourdomain.com',
      },
    },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'ar'],
    },
  },
});
```

### Step 6: Add to Environment
Add to `/apps/cms/.env`:
```bash
RESEND_API_KEY=re_your_actual_key_here
```

### Step 7: Restart Strapi
```bash
cd apps/cms
pnpm develop
```

---

## ✅ Test Your Setup

### Test Password Reset Email
1. Go to http://localhost:3000/en/forgot-password
2. Enter a test email
3. Check Resend dashboard → Logs
4. Email should appear there

### Test Registration Email (if email confirmation enabled)
1. Register a new user
2. Check Resend dashboard
3. Should see confirmation email

---

## 🎨 Customize Email Templates

### In Strapi Admin:
1. Settings → Users & Permissions Plugin
2. Email Templates
3. Edit:
   - Reset password
   - Email address confirmation

### Variables Available:
- `{{ USER.username }}`
- `{{ USER.email }}`
- `{{ CODE }}` (for reset)
- `{{ URL }}` (for confirmation)

---

## 🆓 Alternative Free Services

### 1. Brevo (formerly Sendinblue)
- **Free:** 300 emails/day
- **Setup:** Similar to Resend
- **Provider:** `@strapi/provider-email-nodemailer` with Brevo SMTP

```typescript
email: {
  config: {
    provider: 'nodemailer',
    providerOptions: {
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASSWORD,
      },
    },
  },
}
```

### 2. SendGrid
- **Free:** 100 emails/day
- **Provider:** `@strapi/provider-email-sendgrid`

```bash
npm install @strapi/provider-email-sendgrid
```

```typescript
email: {
  config: {
    provider: 'sendgrid',
    providerOptions: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
  },
}
```

### 3. Mailgun
- **Free:** 5,000 emails/month (first 3 months)
- **Provider:** `@strapi/provider-email-mailgun`

```bash
npm install @strapi/provider-email-mailgun
```

---

## 📊 Comparison

| Service | Free Tier | Best For | Setup Difficulty |
|---------|-----------|----------|------------------|
| **Resend** | 3,000/month | Modern apps | ⭐ Easiest |
| Brevo | 300/day | Marketing emails | ⭐⭐ Easy |
| SendGrid | 100/day | Enterprise apps | ⭐⭐ Easy |
| Mailgun | 5,000/3mo | High volume | ⭐⭐⭐ Medium |

---

## 🐛 Troubleshooting

### Issue: Emails not sending
1. Check Strapi logs for errors
2. Verify API key is correct
3. Check Resend dashboard → Logs
4. Ensure `defaultFrom` email matches verified domain

### Issue: Emails go to spam
1. Add DNS records properly (SPF, DKIM, DMARC)
2. Use verified domain (not test domain)
3. Add unsubscribe link
4. Test with mail-tester.com

### Issue: CORS errors
1. Add your domain to Resend's allowed origins
2. Check Strapi CORS settings

---

## 🔒 Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] API key in production `.env`
- [ ] `defaultFrom` uses verified domain
- [ ] Email templates customized
- [ ] Test emails sent successfully
- [ ] Unsubscribe link added (if marketing emails)
- [ ] Monitor deliverability in Resend dashboard

---

## 💡 Pro Tips

1. **Keep API Keys Secret:**
   - Never commit to git
   - Use environment variables only

2. **Monitor Usage:**
   - Check Resend dashboard regularly
   - Set up alerts before hitting limits

3. **Use Templates:**
   - Create reusable email templates
   - Use HTML for better presentation

4. **Track Opens:**
   - Resend provides open tracking
   - Use for important transactional emails

5. **Rate Limiting:**
   - Implement on your app side
   - Prevent abuse of forgot-password

---

## 📞 Support

- **Resend:** https://resend.com/docs
- **Resend Discord:** https://discord.gg/resend
- **Strapi Email:** https://docs.strapi.io/dev-docs/providers

---

**Recommendation: Use Resend** - It's the most modern, easiest to set up, and has the best free tier for your use case.
