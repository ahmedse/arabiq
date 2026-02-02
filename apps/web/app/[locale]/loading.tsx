import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <Container className="relative z-10">
          <div className="animate-pulse space-y-6 max-w-4xl mx-auto text-center">
            <div className="h-14 bg-slate-200 rounded-xl w-2/3 mx-auto" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto" />
            <div className="flex gap-4 justify-center mt-8">
              <div className="h-12 w-40 bg-slate-200 rounded-lg" />
              <div className="h-12 w-40 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </Container>
      </section>

      {/* Features Grid Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-slate-200 rounded-lg w-1/3 mx-auto" />
            <div className="h-5 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-100">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Skeleton */}
      <section className="py-16 bg-slate-50">
        <Container>
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-slate-200 rounded-lg w-20 mx-auto mb-2" />
                <div className="h-4 bg-slate-200 rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
