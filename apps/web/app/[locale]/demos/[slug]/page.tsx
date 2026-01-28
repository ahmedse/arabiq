import { getDemoBySlug } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverAuth";

type DemoDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function DemoDetailPage({ params }: DemoDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  
  // Always require login for demo pages
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/demos/${slug}`);
  }

  // Check account status
  if (user.accountStatus === 'suspended') {
    redirect(`/${locale}/account-suspended`);
  }
  if (user.accountStatus === 'pending') {
    redirect(`/${locale}/account-pending`);
  }

  const demo = await getDemoBySlug(locale, slug);

  if (!demo) {
    return <h1>Demo not found</h1>;
  }

  // Check role-based access - active users can access demos
  if (user.accountStatus !== 'active') {
    redirect(`/${locale}/access-denied`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{demo.title}</h1>
        {demo.summary ? <p className="text-slate-600">{demo.summary}</p> : null}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-slate-500">
        Demo content placeholder
      </div>
    </div>
  );
}
