/**
 * Admin Page for Demo
 * Position picker and management - only accessible by demo owner or admin
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminDemoEditor } from './AdminDemoEditor';
import { getDemoBySlug } from '@/lib/strapi';
import { fetchDemoItems } from '@/lib/api/demos';
import { auth } from '@/auth';
import type { DemoConfig } from '@/lib/matterport/types';

interface AdminPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Admin - ${slug}`,
    robots: 'noindex, nofollow',
  };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale, slug } = await params;
  
  const demoData = await getDemoBySlug(locale, slug);
  
  if (!demoData || !demoData.matterportModelId) {
    notFound();
  }
  
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/demos/${slug}/admin`);
  }

  // Check if user is demo owner or admin
  const userId = session.user.id;
  const userRole = (session.user as { role?: { type?: string } }).role?.type;
  const isAdmin = userRole === 'admin';
  const isOwner = demoData.ownerId && String(demoData.ownerId) === String(userId);
  
  if (!isAdmin && !isOwner) {
    // User is not authorized - redirect to demo page
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
  
  const items = await fetchDemoItems(demo.id, demo.demoType || 'tour3d', locale);
  
  return (
    <main className="min-h-screen bg-gray-900">
      <AdminDemoEditor 
        demo={demo} 
        items={items}
        locale={locale}
      />
    </main>
  );
}
