'use client';

import Script from 'next/script';

interface AnalyticsProps {
  gaId?: string;
}

/**
 * Analytics component with deferred loading for performance.
 * Only loads in production to avoid skewing development metrics.
 */
export function Analytics({ gaId }: AnalyticsProps) {
  const analyticsId = gaId || process.env.NEXT_PUBLIC_GA_ID;
  
  // Skip in development or if no analytics ID
  if (process.env.NODE_ENV !== 'production' || !analyticsId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics - load after page is interactive */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${analyticsId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track page views manually (for SPA navigation)
 */
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
}

/**
 * Track custom events
 */
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
