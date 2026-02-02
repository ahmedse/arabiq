'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, ArrowRight } from 'lucide-react';

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams();
  const needsConfirmation = searchParams.get('confirmation') === 'true';

  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Account Created Successfully!
      </h1>

      {needsConfirmation ? (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-blue-900">Check Your Email</span>
            </div>
            <p className="text-blue-700 text-sm">
              We&apos;ve sent a verification link to your email address.
              Please click the link to verify your account and complete registration.
            </p>
          </div>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Check your inbox (and spam folder) for our email</li>
              <li>Click the verification link in the email</li>
              <li>Once verified, your account will be reviewed</li>
              <li>We&apos;ll notify you when your account is approved</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <Link href="/en/contact" className="text-indigo-600 hover:text-indigo-700 underline">
              contact support
            </Link>
            .
          </p>
        </>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
              <span className="font-semibold text-amber-900">Pending Approval</span>
            </div>
            <p className="text-amber-700 text-sm">
              Your account has been created and is now pending approval.
              Our team will review your application and notify you via email once approved.
            </p>
          </div>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">What happens next:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Your account is created and saved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">⏳</span>
                <span>Our team reviews your application (usually within 24-48 hours)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">📧</span>
                <span>You&apos;ll receive an email when approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">🚀</span>
                <span>Access all demos and platform features</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Questions? Feel free to{' '}
            <Link href="/en/contact" className="text-indigo-600 hover:text-indigo-700 underline">
              contact us
            </Link>
            .
          </p>
        </>
      )}

      <Link
        href="/en/login"
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Go to Login
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
