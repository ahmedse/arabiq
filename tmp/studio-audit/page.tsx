"use client";

import { Suspense } from "react";
import { VMMLayout } from "../components/VMMLayout";
import { TourStudio } from "./TourStudio";

export default function Page() {
  return (
    <VMMLayout title="Tour Studio">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <TourStudio />
      </Suspense>
    </VMMLayout>
  );
}