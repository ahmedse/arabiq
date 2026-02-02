'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Application Error
          </h1>
          <p className="text-slate-600 mb-8 text-lg">
            Something went wrong with the application. We&apos;re sorry for the inconvenience.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-100 px-4 py-2 rounded-lg inline-block">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg shadow-indigo-200"
            >
              <RotateCcw className="w-5 h-5" />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
