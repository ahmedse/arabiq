import { Container } from "@/components/ui/container";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <section className="py-12 bg-white border-b">
        <Container>
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-slate-200 rounded w-48" />
              <div className="h-5 bg-slate-200 rounded w-64" />
            </div>
            <div className="h-10 w-28 bg-slate-200 rounded-lg" />
          </div>
        </Container>
      </section>

      {/* Main Content Skeleton */}
      <section className="py-12">
        <Container>
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-white rounded-lg border border-slate-200" />
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 animate-pulse">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="h-8 bg-slate-200 rounded w-1/4 mb-8" />
                
                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                      <div className="h-12 bg-slate-100 rounded-lg" />
                    </div>
                  ))}
                </div>

                {/* Full Width Fields */}
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                    <div className="h-24 bg-slate-100 rounded-lg" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <div className="h-12 w-32 bg-slate-300 rounded-lg" />
                  <div className="h-12 w-24 bg-slate-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
