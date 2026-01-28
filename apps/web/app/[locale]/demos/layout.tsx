import type { ReactNode } from "react";

type DemosLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DemosLayout({ children, params }: DemosLayoutProps) {
  // Demos listing should be public. Individual demo detail pages enforce access.
  return <>{children}</>;
}
