import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/serverAuth';
import { getOwnerDemos } from '@/lib/api/dashboard';
import { StatCard } from '@/components/dashboard';
import { 
  Store, 
  ShoppingCart, 
  Users, 
  DollarSign,
  ArrowRight,
  Plus
} from 'lucide-react';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === 'ar' ? 'ar' : 'en';
  const isRTL = locale === 'ar';
  
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard`);
  }
  
  const demos = await getOwnerDemos(user.id, locale);
  
  // Calculate totals
  const totalOrders = demos.reduce((sum, d) => sum + d.stats.orders + d.stats.reservations, 0);
  const totalBookings = demos.reduce((sum, d) => sum + d.stats.bookings, 0);
  const totalInquiries = demos.reduce((sum, d) => sum + d.stats.inquiries, 0);
  const totalRevenue = demos.reduce((sum, d) => sum + d.stats.revenue, 0);
  
  const t = {
    welcome: isRTL ? 'مرحباً' : 'Welcome',
    dashboard: isRTL ? 'لوحة التحكم' : 'Dashboard',
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    totalOrders: isRTL ? 'إجمالي الطلبات' : 'Total Orders',
    totalBookings: isRTL ? 'إجمالي الحجوزات' : 'Total Bookings',
    totalInquiries: isRTL ? 'إجمالي الاستفسارات' : 'Total Inquiries',
    totalRevenue: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
    myDemos: isRTL ? 'عروضي' : 'My Demos',
    noDemos: isRTL ? 'لا توجد عروض بعد' : 'No demos yet',
    contactAdmin: isRTL ? 'تواصل مع الإدارة لإضافة عرض' : 'Contact admin to add a demo',
    viewDemo: isRTL ? 'عرض التفاصيل' : 'View Details',
    orders: isRTL ? 'طلبات' : 'orders',
    bookings: isRTL ? 'حجوزات' : 'bookings',
    inquiries: isRTL ? 'استفسارات' : 'inquiries',
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
        <h1 className="text-2xl lg:text-3xl font-bold">
          {t.welcome}, {user.displayName || user.username}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.overview}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.totalOrders}
          value={totalOrders}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label={t.totalBookings}
          value={totalBookings}
          icon={Users}
          color="success"
        />
        <StatCard
          label={t.totalInquiries}
          value={totalInquiries}
          icon={Store}
          color="warning"
        />
        <StatCard
          label={t.totalRevenue}
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="default"
        />
      </div>
      
      {/* Demos List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t.myDemos}</h2>
        
        {demos.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t.noDemos}</p>
            <p className="text-muted-foreground mt-1">{t.contactAdmin}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demos.map((demo) => (
              <Link
                key={demo.id}
                href={`/${locale}/dashboard/${demo.slug}`}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {demo.featuredImage ? (
                    <Image
                      src={demo.featuredImage}
                      alt={demo.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Store className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-black/50 text-white rounded">
                    {demo.demoType}
                  </span>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {demo.title}
                  </h3>
                  
                  {/* Stats */}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{demo.stats.orders + demo.stats.reservations} {t.orders}</span>
                    <span>{demo.stats.bookings} {t.bookings}</span>
                    <span>{demo.stats.inquiries} {t.inquiries}</span>
                  </div>
                  
                  {/* View link */}
                  <div className="flex items-center gap-1 mt-3 text-primary text-sm font-medium">
                    {t.viewDemo}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
