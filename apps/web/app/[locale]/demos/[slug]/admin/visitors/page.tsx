/**
 * Admin Visitors Page
 * Dashboard for monitoring live visitors in virtual store
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminVisitorDashboard } from './AdminVisitorDashboard';
import { getDemoBySlug } from '@/lib/strapi';
import { auth } from '@/auth';
import type { DemoConfig } from '@/lib/matterport/types';

interface VisitorsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: VisitorsPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  return {
    title: locale === 'ar' ? `الزوار - ${slug}` : `Visitors - ${slug}`,
    robots: 'noindex, nofollow',
  };
}

export default async function VisitorsPage({ params }: VisitorsPageProps) {
  const { locale, slug } = await params;
  
  const demoData = await getDemoBySlug(locale, slug);
  
  if (!demoData || !demoData.matterportModelId) {
    notFound();
  }
  
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/demos/${slug}/admin/visitors`);
  }

  // Check if user is demo owner or admin
  const userId = session.user.id;
  const userRole = (session.user as { role?: { type?: string } }).role?.type;
  const isAdmin = userRole === 'admin';
  const isOwner = demoData.ownerId && String(demoData.ownerId) === String(userId);
  
  if (!isAdmin && !isOwner) {
    redirect(`/${locale}/demos/${slug}?error=unauthorized`);
  }
  
  // Convert to DemoConfig format
  const demo: DemoConfig = {
    id: demoData.id,
    slug: demoData.slug,
    title: demoData.title,
    summary: demoData.summary,
    matterportModelId: demoData.matterportModelId,
    demoType: (demoData.demoType || 'tour3d') as DemoConfig['demoType'],
    featuredImage: demoData.image?.url,
    businessName: demoData.businessName,
    businessPhone: demoData.businessPhone,
    businessEmail: demoData.businessEmail,
    businessWhatsapp: demoData.businessWhatsapp,
    enableVoiceOver: demoData.enableVoiceOver ?? false,
    enableLiveChat: demoData.enableLiveChat ?? false,
    enableAiChat: demoData.enableAiChat ?? true,
  };
  
  return <AdminVisitorDashboard demo={demo} locale={locale} />;
}
