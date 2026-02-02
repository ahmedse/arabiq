# Arabiq Web Application

> **Next.js 16** application for the Arabiq platform - Virtual Reality experiences for MENA region.

---

## Features

- ✅ **Bilingual Support**: Full English & Arabic (RTL) support
- ✅ **Strapi CMS**: Headless CMS for content management
- ✅ **Authentication**: Register, login, password reset with Strapi backend
- ✅ **Account Management**: User profiles, password changes
- ✅ **Admin Dashboard**: User management, approve/suspend accounts
- ✅ **SEO Optimized**: Dynamic meta tags, Open Graph, Twitter Cards
- ✅ **Performance**: Image optimization (AVIF/WebP), lazy loading, ISR caching
- ✅ **Security**: Rate limiting, CSP headers, Zod validation
- ✅ **Email**: Resend integration for contact forms
- ✅ **Responsive**: Mobile-first design with Tailwind CSS

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Strapi CMS running (see `../cms/README.md`)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your values
# STRAPI_URL=http://localhost:1337
# STRAPI_API_TOKEN=your_token
# etc.
```

### Development

```bash
# Start development server
pnpm dev

# Server runs at http://localhost:3000
# English: http://localhost:3000/en
# Arabic: http://localhost:3000/ar
```

### Building for Production

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Production server runs at http://localhost:3000
```

---

## Project Structure

```
apps/web/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── page.tsx        # Homepage
│   │   ├── about/          # About page
│   │   ├── contact/        # Contact form
│   │   ├── solutions/      # Solutions list & detail
│   │   ├── industries/     # Industries list & detail
│   │   ├── case-studies/   # Case studies
│   │   ├── demos/          # VTour demos
│   │   ├── login/          # Authentication
│   │   ├── register/
│   │   ├── account/        # User dashboard
│   │   └── admin/          # Admin panel
│   ├── api/                # API routes
│   │   ├── contact/        # Contact form submission
│   │   ├── auth/           # Auth endpoints
│   │   └── account/        # Account management
│   └── layout.tsx          # Root layout
├── components/
│   ├── OptimizedImage.tsx  # Image optimization wrapper
│   ├── LazySection.tsx     # Lazy loading wrapper
│   ├── Analytics.tsx       # Google Analytics
│   ├── Footer.tsx          # Site footer
│   ├── Header.tsx          # Site header
│   └── ...
├── lib/
│   ├── strapi.ts           # Strapi API client
│   ├── auth.ts             # Auth helpers
│   └── rateLimit.ts        # Rate limiting
├── messages/               # i18n translations
│   ├── en.json             # English translations
│   └── ar.json             # Arabic translations
├── public/                 # Static assets
└── next.config.ts          # Next.js configuration
```

---

## Environment Variables

See `.env.production.example` for complete list. Key variables:

```bash
# Required
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token
SITE_URL=http://localhost:3000
RESEND_API_KEY=re_your_key
ADMIN_EMAIL=admin@arabiq.tech

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

---

## Available Scripts

```bash
pnpm dev          # Start development server (port 3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler check
```

---

## Management Script (From Root)

Use the root `./manage.sh` script for easier management:

```bash
./manage.sh start          # Start CMS + Web
./manage.sh start web      # Start only Web
./manage.sh stop           # Stop all
./manage.sh restart web    # Restart Web
./manage.sh logs web -f    # Follow Web logs
./manage.sh clean web      # Clean Web build
./manage.sh doctor         # Full diagnostic
./manage.sh seed           # Seed CMS content
```

---

## Key Technologies

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Icons**: [Lucide Icons](https://lucide.dev)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms**: [React Hook Form](https://react-hook-form.com)
- **Validation**: [Zod](https://zod.dev)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app)
- **CMS**: [Strapi](https://strapi.io)
- **Email**: [Resend](https://resend.com)

---

## Testing

### Manual Testing Checklist

- [ ] Homepage loads in EN/AR
- [ ] All navigation links work
- [ ] Language switcher functions
- [ ] Contact form submits successfully
- [ ] Login/Register flows work
- [ ] Account dashboard accessible
- [ ] Admin panel (for admin users)
- [ ] 404 page displays
- [ ] Mobile responsive
- [ ] RTL layout in Arabic

### Automated Testing Script

```bash
cd /home/ahmed/arabiq
./test-pages.sh  # Tests all pages for HTTP 200
```

---

## Performance Optimizations

### Images
- AVIF/WebP modern formats
- Responsive srcset for device sizes
- Lazy loading with blur placeholder
- 24-hour CDN cache

### JavaScript
- Package import optimization (lucide-react, framer-motion)
- Lazy loading for below-fold sections
- Deferred analytics loading

### Caching
- ISR with configurable revalidation times
- Cache tags for granular invalidation
- Stale-while-revalidate strategy

### Network
- Preconnect to Google Fonts
- DNS prefetch for third-party domains
- Optimized bundle splitting

---

## Security Features

- **Rate Limiting**: Protects against brute force attacks
- **CSP Headers**: Content Security Policy configured
- **CSRF Protection**: Built-in Next.js CSRF tokens
- **Input Validation**: Zod schemas for all forms
- **Secure Cookies**: HttpOnly, SameSite=Strict
- **XSS Protection**: React automatically escapes content

---

## Deployment

### Option 1: Vercel (Recommended for Web)

```bash
npm i -g vercel
cd apps/web
vercel --prod
```

Add environment variables in Vercel dashboard.

### Option 2: VPS with PM2

```bash
cd apps/web
pnpm build
pm2 start npm --name "arabiq-web" -- start
pm2 save
```

See `/PRODUCTION_DEPLOYMENT.md` for complete guide.

---

## Troubleshooting

### Issue: "Cannot connect to Strapi"
- Ensure CMS is running: `./manage.sh start cms`
- Check `STRAPI_URL` in `.env.local`
- Verify `STRAPI_API_TOKEN` is correct

### Issue: "Images not loading"
- Check Strapi media folder permissions
- Verify `next.config.ts` remotePatterns includes Strapi domain

### Issue: "Arabic text not aligned right"
- Clear browser cache
- Check `dir="rtl"` in HTML for `/ar` routes

### Issue: Contact form not sending emails
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for delivery status
- Ensure `ADMIN_EMAIL` is verified in Resend

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run linter: `pnpm lint`
4. Type check: `pnpm tsc --noEmit`
5. Commit: `git commit -m "feat: add my feature"`
6. Push and create PR

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Strapi Documentation](https://docs.strapi.io)
- [next-intl Documentation](https://next-intl-docs.vercel.app)
- [Arabiq Platform Docs](../../docs/)

---

## License

Proprietary - Arabiq Platform  
© 2026 Arabiq. All rights reserved.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
