/**
 * Owner Dashboard Page
 * Real-time visitor monitoring and live chat for demo owners
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDemoBySlug } from '@/lib/strapi';
import { auth } from '@/auth';
import { OwnerDashboardClient } from './OwnerDashboardClient';

interface OwnerPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: OwnerPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const demo = await getDemoBySlug(slug, locale);
  
  if (!demo) {
    return { title: 'Not Found' };
  }
  
  return {
    title: locale === 'ar' 
      ? `لوحة تحكم المالك - ${demo.title}`
      : `Owner Dashboard - ${demo.title}`,
    description: locale === 'ar'
      ? 'مراقبة الزوار والدردشة المباشرة'
      : 'Monitor visitors and live chat',
    robots: { index: false, follow: false },
  };
}

export default async function OwnerPage({ params }: OwnerPageProps) {
  const { locale, slug } = await params;
  const demo = await getDemoBySlug(locale, slug);
  
  if (!demo) {
    notFound();
  }
  
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/demos/${slug}/owner`);
  }

  // Check if user is demo owner or admin
  const userId = session.user.id;
  const userRole = (session.user as { role?: { type?: string } }).role?.type;
  const isAdmin = userRole === 'admin';
  const isOwner = demo.ownerId && String(demo.ownerId) === String(userId);
  
  if (!isAdmin && !isOwner) {
    // User is not authorized - redirect to demo page
    redirect(`/${locale}/demos/${slug}`);
  }
  
  return (
    <OwnerDashboardClient
      demoSlug={slug}
      demoTitle={demo.title}
      locale={locale}
    />
  );
}
