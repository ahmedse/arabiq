import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/serverAuth';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe,
  Lock,
  Bell,
  CreditCard
} from 'lucide-react';

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === 'ar' ? 'ar' : 'en';
  const isRTL = locale === 'ar';
  
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard/settings`);
  }
  
  const t = {
    settings: isRTL ? 'الإعدادات' : 'Settings',
    accountSettings: isRTL ? 'إعدادات الحساب' : 'Account Settings',
    profile: isRTL ? 'الملف الشخصي' : 'Profile',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    phone: isRTL ? 'رقم الهاتف' : 'Phone',
    company: isRTL ? 'الشركة' : 'Company',
    country: isRTL ? 'البلد' : 'Country',
    security: isRTL ? 'الأمان' : 'Security',
    changePassword: isRTL ? 'تغيير كلمة المرور' : 'Change Password',
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    billing: isRTL ? 'الفواتير' : 'Billing',
    editProfile: isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile',
    comingSoon: isRTL ? 'قريباً' : 'Coming Soon',
    manageAccount: isRTL ? 'إدارة الحساب' : 'Manage Account',
  };
  
  const settingsSections = [
    {
      title: t.security,
      icon: Lock,
      items: [
        { label: t.changePassword, href: `/${locale}/account`, comingSoon: false },
      ],
    },
    {
      title: t.notifications,
      icon: Bell,
      items: [
        { label: t.notifications, href: '#', comingSoon: true },
      ],
    },
    {
      title: t.billing,
      icon: CreditCard,
      items: [
        { label: t.billing, href: '#', comingSoon: true },
      ],
    },
  ];
  
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">{t.settings}</h1>
        <p className="text-muted-foreground mt-1">{t.accountSettings}</p>
      </div>
      
      {/* Profile Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            {t.profile}
          </h2>
          <Link
            href={`/${locale}/account`}
            className="text-sm text-primary hover:underline"
          >
            {t.editProfile}
          </Link>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {(user.displayName || user.username).slice(0, 2).toUpperCase()}
            </div>
            
            <div>
              <p className="font-semibold text-lg">{user.displayName || user.username}</p>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t.email}</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            
            {user.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.phone}</p>
                  <p className="text-sm">{user.phone}</p>
                </div>
              </div>
            )}
            
            {user.company && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                  <p className="text-sm">{user.company}</p>
                </div>
              </div>
            )}
            
            {user.country && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t.country}</p>
                  <p className="text-sm">{user.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Other Settings */}
      {settingsSections.map((section) => (
        <div key={section.title} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <section.icon className="w-5 h-5" />
              {section.title}
            </h2>
          </div>
          
          <div className="divide-y divide-border">
            {section.items.map((item) => (
              <div key={item.label}>
                {item.comingSoon ? (
                  <div className="p-4 flex items-center justify-between text-muted-foreground">
                    <span>{item.label}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{t.comingSoon}</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-primary">→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
