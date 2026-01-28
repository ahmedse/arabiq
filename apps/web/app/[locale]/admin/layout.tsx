import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/serverAuth";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  const admin = await isAdmin();
  
  if (!admin) {
    redirect(`/${locale}/login`);
  }

  return <>{children}</>;
}
