import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/serverAuth';
import { getOwnerDemos } from '@/lib/api/dashboard';
import { StatCard } from '@/components/dashboard';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  ShoppingCart,
  Calendar
} from 'lucide-react';

interface AnalyticsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === 'ar' ? 'ar' : 'en';
  const isRTL = locale === 'ar';
  
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard/analytics`);
  }
  
  const demos = await getOwnerDemos(user.id, locale);
  
  // Calculate totals
  const totalOrders = demos.reduce((sum, d) => sum + d.stats.orders + d.stats.reservations, 0);
  const totalBookings = demos.reduce((sum, d) => sum + d.stats.bookings, 0);
  const totalInquiries = demos.reduce((sum, d) => sum + d.stats.inquiries, 0);
  const totalRevenue = demos.reduce((sum, d) => sum + d.stats.revenue, 0);
  
  const t = {
    analytics: isRTL ? 'التحليلات' : 'Analytics',
    overallStats: isRTL ? 'الإحصائيات العامة' : 'Overall Statistics',
    totalOrders: isRTL ? 'إجمالي الطلبات' : 'Total Orders',
    totalBookings: isRTL ? 'إجمالي الحجوزات' : 'Total Bookings',
    totalInquiries: isRTL ? 'إجمالي الاستفسارات' : 'Total Inquiries',
    totalRevenue: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
    totalDemos: isRTL ? 'إجمالي العروض' : 'Total Demos',
    performanceByDemo: isRTL ? 'الأداء حسب العرض' : 'Performance by Demo',
    demo: isRTL ? 'العرض' : 'Demo',
    orders: isRTL ? 'الطلبات' : 'Orders',
    bookings: isRTL ? 'الحجوزات' : 'Bookings',
    inquiries: isRTL ? 'الاستفسارات' : 'Inquiries',
    revenue: isRTL ? 'الإيرادات' : 'Revenue',
    comingSoon: isRTL ? 'المزيد من التحليلات قريباً' : 'More analytics coming soon',
    description: isRTL 
      ? 'ستتوفر تحليلات متقدمة تشمل اتجاهات الزوار ومعدلات التحويل والمزيد.'
      : 'Advanced analytics including visitor trends, conversion rates, and more will be available soon.',
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">{t.analytics}</h1>
        <p className="text-muted-foreground mt-1">{t.overallStats}</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label={t.totalDemos}
          value={demos.length}
          icon={BarChart3}
          color="primary"
        />
        <StatCard
          label={t.totalOrders}
          value={totalOrders}
          icon={ShoppingCart}
          color="default"
        />
        <StatCard
          label={t.totalBookings}
          value={totalBookings}
          icon={Calendar}
          color="success"
        />
        <StatCard
          label={t.totalInquiries}
          value={totalInquiries}
          icon={Users}
          color="warning"
        />
        <StatCard
          label={t.totalRevenue}
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="default"
        />
      </div>
      
      {/* Performance by Demo */}
      {demos.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{t.performanceByDemo}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                    {t.demo}
                  </th>
                  <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                    {t.orders}
                  </th>
                  <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                    {t.bookings}
                  </th>
                  <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                    {t.inquiries}
                  </th>
                  <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                    {t.revenue}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demos.map((demo) => (
                  <tr key={demo.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{demo.title}</p>
                        <p className="text-sm text-muted-foreground">{demo.demoType}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{demo.stats.orders + demo.stats.reservations}</td>
                    <td className="px-4 py-3">{demo.stats.bookings}</td>
                    <td className="px-4 py-3">{demo.stats.inquiries}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(demo.stats.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Coming Soon */}
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{t.comingSoon}</p>
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">{t.description}</p>
      </div>
    </div>
  );
}
