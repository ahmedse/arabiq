import { Container } from "@/components/ui/container";

export default function IndustriesLoading() {
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

      {/* Industries Grid Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group relative rounded-2xl bg-slate-50 overflow-hidden">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-slate-200 rounded-lg w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats Section Skeleton */}
      <section className="py-16 bg-indigo-600">
        <Container>
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-indigo-400 rounded-lg w-24 mx-auto mb-2" />
                <div className="h-4 bg-indigo-400 rounded w-20 mx-auto" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
