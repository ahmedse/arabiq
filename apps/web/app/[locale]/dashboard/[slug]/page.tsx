import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/serverAuth';
import { 
  getOwnerDemoBySlug, 
  getDashboardStats, 
  getDemoOrders,
  getDemoAnalytics 
} from '@/lib/api/dashboard';
import { DashboardOverview } from './DashboardOverview';
import { OrdersTable } from './OrdersTable';
import { VisitorsPanel } from './VisitorsPanel';
import { AnalyticsCharts } from './AnalyticsCharts';
import { 
  ExternalLink, 
  Settings, 
  Eye
} from 'lucide-react';

interface DemoDashboardPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function DemoDashboardPage({ params }: DemoDashboardPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === 'ar' ? 'ar' : 'en';
  const isRTL = locale === 'ar';
  
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard/${slug}`);
  }
  
  // Get demo owned by user
  const demo = await getOwnerDemoBySlug(user.id, slug, locale);
  
  if (!demo) {
    notFound();
  }
  
  // Fetch dashboard data
  const [stats, ordersData, analytics] = await Promise.all([
    getDashboardStats(demo.id),
    getDemoOrders(demo.id, { pageSize: 10 }),
    getDemoAnalytics(demo.id),
  ]);
  
  const t = {
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    recentOrders: isRTL ? 'الطلبات الأخيرة' : 'Recent Orders',
    liveVisitors: isRTL ? 'الزوار النشطين' : 'Live Visitors',
    analytics: isRTL ? 'التحليلات' : 'Analytics',
    viewDemo: isRTL ? 'عرض الديمو' : 'View Demo',
    ownerPanel: isRTL ? 'لوحة المالك' : 'Owner Panel',
    settings: isRTL ? 'الإعدادات' : 'Settings',
    viewAll: isRTL ? 'عرض الكل' : 'View All',
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{demo.title}</h1>
            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
              {demo.demoType}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{t.overview}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/demos/${slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {t.viewDemo}
            <ExternalLink className="w-3 h-3" />
          </Link>
          
          <Link
            href={`/${locale}/demos/${slug}/owner`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            {t.ownerPanel}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
      
      {/* Stats Overview */}
      <DashboardOverview 
        stats={stats} 
        demoType={demo.demoType}
        locale={locale} 
      />
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders Table - 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t.recentOrders}</h2>
            <Link 
              href={`/${locale}/dashboard/${slug}/orders`}
              className="text-sm text-primary hover:underline"
            >
              {t.viewAll}
            </Link>
          </div>
          <OrdersTable
            demoId={demo.id}
            demoType={demo.demoType}
            initialOrders={ordersData.items}
            locale={locale}
          />
        </div>
        
        {/* Live Visitors - 1 column */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t.liveVisitors}</h2>
          <VisitorsPanel 
            demoSlug={slug}
            locale={locale}
          />
        </div>
      </div>
      
      {/* Analytics Charts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t.analytics}</h2>
        <AnalyticsCharts 
          analytics={analytics}
          locale={locale}
        />
      </div>
    </div>
  );
}
