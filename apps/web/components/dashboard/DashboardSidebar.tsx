'use client';

/**
 * Dashboard Sidebar
 * Navigation for dashboard pages
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Settings,
  Store,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import type { DemoSummary } from '@/lib/api/dashboard';

interface DashboardSidebarProps {
  demos: DemoSummary[];
  locale: string;
  currentSlug?: string;
}

export function DashboardSidebar({ demos, locale, currentSlug }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isRTL = locale === 'ar';
  const [isOpen, setIsOpen] = React.useState(false);
  
  const t = {
    dashboard: isRTL ? 'لوحة التحكم' : 'Dashboard',
    myDemos: isRTL ? 'عروضي' : 'My Demos',
    analytics: isRTL ? 'التحليلات' : 'Analytics',
    settings: isRTL ? 'الإعدادات' : 'Settings',
    backToSite: isRTL ? 'العودة للموقع' : 'Back to Site',
    orders: isRTL ? 'الطلبات' : 'Orders',
    visitors: isRTL ? 'الزوار' : 'Visitors',
  };
  
  const navItems = [
    { 
      href: `/${locale}/dashboard`, 
      label: t.dashboard, 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      href: `/${locale}/dashboard/analytics`, 
      label: t.analytics, 
      icon: BarChart3 
    },
    { 
      href: `/${locale}/dashboard/settings`, 
      label: t.settings, 
      icon: Settings 
    },
  ];
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };
  
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg border border-border"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 ${isRTL ? 'right-0' : 'left-0'} z-40
          w-64 h-screen bg-card border-${isRTL ? 'l' : 'r'} border-border
          flex flex-col
          transform transition-transform lg:transform-none
          ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}
          lg:translate-x-0
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Link 
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 text-xl font-bold text-primary"
          >
            <Store className="w-6 h-6" />
            <span>{t.dashboard}</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Main nav */}
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors
                    ${isActive(item.href, item.exact)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Demos section */}
          {demos.length > 0 && (
            <div className="mt-6">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t.myDemos}
              </h3>
              <ul className="space-y-1">
                {demos.map((demo) => (
                  <li key={demo.id}>
                    <Link
                      href={`/${locale}/dashboard/${demo.slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-colors
                        ${currentSlug === demo.slug
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                        }
                      `}
                    >
                      <Store className="w-4 h-4" />
                      <span className="truncate">{demo.title}</span>
                    </Link>
                    
                    {/* Sub-nav for current demo */}
                    {currentSlug === demo.slug && (
                      <ul className={`mt-1 space-y-1 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                        <li>
                          <Link
                            href={`/${locale}/dashboard/${demo.slug}/orders`}
                            onClick={() => setIsOpen(false)}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded text-sm
                              ${pathname.includes('/orders')
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                              }
                            `}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {t.orders}
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={`/${locale}/dashboard/${demo.slug}/visitors`}
                            onClick={() => setIsOpen(false)}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded text-sm
                              ${pathname.includes('/visitors')
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                              }
                            `}
                          >
                            <Users className="w-4 h-4" />
                            {t.visitors}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t.backToSite}
          </Link>
        </div>
      </aside>
    </>
  );
}
