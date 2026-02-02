import { Container } from "@/components/ui/container";

export default function AboutLoading() {
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

      {/* Mission Section Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
              </div>
            </div>
            <div className="h-80 bg-slate-200 rounded-2xl" />
          </div>
        </Container>
      </section>

      {/* Values Grid Skeleton */}
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-slate-200 rounded-lg w-1/4 mx-auto" />
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-white">
                  <div className="w-14 h-14 bg-slate-200 rounded-full mb-4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Team Section Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-slate-200 rounded-lg w-1/4 mx-auto" />
            <div className="grid md:grid-cols-4 gap-8 mt-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-full mx-auto mb-4" />
                  <div className="h-5 bg-slate-200 rounded w-2/3 mx-auto mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
