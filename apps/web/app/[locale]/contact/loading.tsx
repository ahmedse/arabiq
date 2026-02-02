import { Container } from "@/components/ui/container";

export default function ContactLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <Container className="relative z-10">
          <div className="animate-pulse space-y-6 max-w-3xl mx-auto text-center">
            <div className="h-12 bg-slate-200 rounded-xl w-1/3 mx-auto" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto" />
          </div>
        </Container>
      </section>

      {/* Form & Info Section Skeleton */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form Skeleton */}
            <div className="rounded-2xl bg-slate-50 p-8 lg:p-10 animate-pulse">
              <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-8" />
              <div className="space-y-6">
                {/* Name field */}
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-12 bg-slate-200 rounded-lg w-full" />
                </div>
                {/* Email field */}
                <div>
                  <div className="h-4 bg-slate-200 rounded w-28 mb-2" />
                  <div className="h-12 bg-slate-200 rounded-lg w-full" />
                </div>
                {/* Phone field */}
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-12 bg-slate-200 rounded-lg w-full" />
                </div>
                {/* Message field */}
                <div>
                  <div className="h-4 bg-slate-200 rounded w-28 mb-2" />
                  <div className="h-32 bg-slate-200 rounded-lg w-full" />
                </div>
                {/* Submit button */}
                <div className="h-14 bg-slate-300 rounded-lg w-full" />
              </div>
            </div>

            {/* Contact Info Skeleton */}
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 rounded-lg w-1/2" />
              
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
