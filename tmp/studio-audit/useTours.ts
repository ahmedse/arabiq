"use client";

import { useAdminApi } from "@/lib/hooks/useAdminApi";

interface Tour {
  id: string;
  title: string;
  external_id: string;
  tour_url: string;
  tour_type: string;
  status: string;
  shop_name: string;
}

export function useTours() {
  return useAdminApi<Tour>({ endpoint: "tours" });
}