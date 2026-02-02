import { Container } from "@/components/ui/container";

export default function CaseStudiesLoading() {
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

      {/* Case Studies Grid Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="animate-pulse space-y-12">
            {/* Featured Case Study */}
            <div className="rounded-2xl bg-slate-50 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto bg-slate-200" />
                <div className="p-8 lg:p-12 space-y-4">
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                  </div>
                  <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                  </div>
                  <div className="h-10 bg-slate-200 rounded-lg w-1/3 mt-4" />
                </div>
              </div>
            </div>

            {/* Case Studies Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-slate-50 overflow-hidden">
                  <div className="aspect-video bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 bg-slate-200 rounded-full w-16" />
                      <div className="h-5 bg-slate-200 rounded-full w-20" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-4/5" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
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
