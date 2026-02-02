import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

// Security headers for production hardening
const securityHeaders = [
  // DNS prefetch for performance
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  
  // HTTPS enforcement (2 years, include subdomains, allow preload)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  
  // XSS protection (legacy but still useful)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  
  // Referrer policy for privacy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  
  // Restrict browser features/APIs
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      // Default to self for everything
      "default-src 'self'",
      // Scripts: self + unsafe-inline for Next.js + Matterport
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.matterport.com",
      // Styles: self + inline (Tailwind) + Google Fonts
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      // Images: self + data URIs + blob + external services
      "img-src 'self' blob: data: *.matterport.com *.strapi.io localhost:1337 127.0.0.1:1337",
      // Fonts: self + Google Fonts
      "font-src 'self' fonts.gstatic.com data:",
      // API/fetch connections
      "connect-src 'self' *.matterport.com localhost:1337 127.0.0.1:1337 ws://localhost:* wss://localhost:*",
      // Frames: self + Matterport embeds
      "frame-src 'self' *.matterport.com",
      // No plugins/objects
      "object-src 'none'",
      // Base URL restriction
      "base-uri 'self'",
      // Form targets
      "form-action 'self'",
      // Frame ancestors (who can embed us)
      "frame-ancestors 'self'",
      // Upgrade insecure requests in production
      process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join('; ')
  }
];

const nextConfig: NextConfig = {
  images: {
    // Avoid dev-time /_next/image 400s when the optimizer can't load local assets.
    // If you want optimization, install `sharp` in apps/web and remove this.
    unoptimized: true,
  },
  
  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
