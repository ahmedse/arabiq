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
  // Demos listing should be public. Individual demo detail pages enforce access
  // by checking `allowedRoles` on the demo item. Keep this layout public to
  // allow browsing the demos index without signing-in.
  return <>{children}</>;
}
