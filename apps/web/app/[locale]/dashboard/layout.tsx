import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/serverAuth';
import { getOwnerDemos } from '@/lib/api/dashboard';
import { DashboardSidebar } from '@/components/dashboard';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({ 
  children, 
  params 
}: DashboardLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === 'ar' ? 'ar' : 'en';
  const isRTL = locale === 'ar';
  
  // Require authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard`);
  }
  
  // Check account status
  if (user.accountStatus !== 'active') {
    redirect(`/${locale}/account-pending`);
  }
  
  // Get demos owned by user
  const demos = await getOwnerDemos(user.id, locale);
  
  return (
    <div 
      className="min-h-screen bg-background flex"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <DashboardSidebar 
        demos={demos} 
        locale={locale}
      />
      
      <main className="flex-1 lg:ml-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
