'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Container>
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-8">
            We apologize for the inconvenience. Please try again or return to the homepage.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mb-6 font-mono">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/en"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
