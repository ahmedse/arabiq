import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const session = await auth();
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const adminEmails = getAdminEmails();
  const userEmail = session.user.email.toLowerCase();

  if (!adminEmails.includes(userEmail)) {
    return <h1>403 Forbidden</h1>;
  }

  return <>{children}</>;
}
