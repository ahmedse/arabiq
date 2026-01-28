import { getCurrentUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountSuspendedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/en/login');
  }

  if (user.accountStatus === 'active') {
    redirect('/en/account');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
            
            <div className="mt-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left">
                <p className="text-sm text-red-800">
                  Your account has been suspended by an administrator. You currently do not have access to demos or restricted content.
                </p>
              </div>

              <div className="bg-gray-50 rounded-md p-4 text-left text-sm text-gray-700">
                <p className="font-semibold mb-2">What can you do?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Contact support for more information</li>
                  <li>Request a review of your account</li>
                  <li>Ensure compliance with terms of service</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Need help?</strong><br />
                  Email: support@arabiq.com<br />
                  We typically respond within 24 hours
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/en"
                className="block w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
