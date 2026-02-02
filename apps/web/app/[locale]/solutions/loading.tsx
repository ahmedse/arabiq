import { Container } from "@/components/ui/container";

export default function SolutionsLoading() {
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

      {/* Solutions Grid Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse space-y-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-7 bg-slate-200 rounded-lg w-3/4 mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                  </div>
                  <div className="h-10 bg-slate-200 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section Skeleton */}
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="animate-pulse max-w-3xl mx-auto text-center">
            <div className="h-10 bg-slate-200 rounded-lg w-2/3 mx-auto mb-4" />
            <div className="h-5 bg-slate-200 rounded w-1/2 mx-auto mb-8" />
            <div className="h-12 w-40 bg-slate-300 rounded-lg mx-auto" />
          </div>
        </Container>
      </section>
    </div>
  );
}
