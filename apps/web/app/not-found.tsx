import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Container>
        <div className="text-center max-w-xl mx-auto">
          {/* 404 Visual */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-indigo-600/10 select-none">404</div>
            <div className="relative -mt-16">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Page not found
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It might have been moved or doesn&apos;t exist.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/en"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
            >
              <Home className="w-4 h-4" />
              Go to homepage
            </Link>
            <button
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">You might find these helpful:</p>
            <div className="flex gap-4 justify-center flex-wrap text-sm">
              <Link href="/en/solutions" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Solutions
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/en/demos" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Demos
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/en/contact" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
