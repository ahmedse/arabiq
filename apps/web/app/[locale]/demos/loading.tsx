import { Container } from "@/components/ui/container";

export default function DemosLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <Container className="relative z-10">
          <div className="animate-pulse space-y-6 max-w-3xl mx-auto text-center">
            <div className="h-12 bg-slate-200 rounded-xl w-1/2 mx-auto" />
            <div className="h-6 bg-slate-200 rounded-lg w-2/3 mx-auto" />
          </div>
        </Container>
      </section>

      {/* Demo Cards Grid Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse space-y-8">
            {/* Category Tabs */}
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded-lg w-24" />
              ))}
            </div>

            {/* Demo Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                  <div className="aspect-video bg-slate-200 relative">
                    <div className="absolute top-4 right-4 h-8 w-20 bg-slate-300 rounded-full" />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-4 bg-slate-200 rounded w-5/6" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <div className="h-10 bg-slate-300 rounded-lg flex-1" />
                      <div className="h-10 bg-slate-200 rounded-lg flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
