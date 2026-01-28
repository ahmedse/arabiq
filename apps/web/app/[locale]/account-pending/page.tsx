import { getCurrentUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPendingPage() {
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
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
            
            <div className="mt-6 space-y-4 text-left">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Your account has been created successfully and is awaiting administrator approval.
                </p>
              </div>

              <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>An administrator will review your account</li>
                  <li>You'll receive an email once approved</li>
                  <li>This usually takes 1-2 business days</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Your Details:</strong><br />
                  Email: {user.email}<br />
                  Username: {user.username}
                  {user.phone && <><br />Phone: {user.phone}</>}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href="/en/account"
                className="block w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View My Account
              </Link>
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
