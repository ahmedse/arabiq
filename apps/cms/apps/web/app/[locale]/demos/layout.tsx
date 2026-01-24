import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type DemosLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const dynamic = "force-dynamic";

export default async function DemosLayout({ children, params }: DemosLayoutProps) {
  const session = await auth();
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const approval = await prisma.userApproval.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });

  const status = (approval?.status ?? "PENDING") as ApprovalStatus;

  if (status === "PENDING") {
    redirect(`/${locale}/access-pending`);
  }

  if (status === "REJECTED") {
    redirect(`/${locale}/access-rejected`);
  }

  return <>{children}</>;
}
