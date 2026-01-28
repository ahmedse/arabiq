'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { strapiUpdateProfile, type StrapiUser } from '@/lib/strapiAuth';
import Cookies from 'js-cookie';

export default function AccountClient({ user: initialUser }: { user: StrapiUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    country: user.country || '',
    company: user.company || '',
    salesContactAllowed: user.salesContactAllowed ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = Cookies.get('strapi_jwt');
      if (!token) {
        router.push('/en/login');
        return;
      }

      const updatedUser = await strapiUpdateProfile(token, formData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('strapi_jwt');
    router.push('/en/login');
  };

  const getStatusBadge = () => {
    switch (user.accountStatus) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Pending Approval</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Suspended</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{user.accountStatus}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                <p className="mt-1 text-sm text-gray-600">Manage your profile and preferences</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-6 mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Account Status */}
          {user.accountStatus === 'pending' && (
            <div className="mx-6 mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h3 className="text-sm font-medium text-yellow-800">Account Pending Approval</h3>
              <p className="mt-2 text-sm text-yellow-700">
                Your account is awaiting administrator approval. You'll receive an email once your account is activated.
              </p>
            </div>
          )}

          {/* Profile Information */}
          <div className="px-6 py-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Status</label>
                  <p className="mt-1">{getStatusBadge()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{user.role?.name || 'User'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Editable Details</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company/Organization
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="salesContactAllowed"
                      name="salesContactAllowed"
                      type="checkbox"
                      checked={formData.salesContactAllowed}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="salesContactAllowed" className="ml-2 block text-sm text-gray-700">
                      Allow sales team to contact me
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          displayName: user.displayName || '',
                          country: user.country || '',
                          company: user.company || '',
                          salesContactAllowed: user.salesContactAllowed ?? true,
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.displayName || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="mt-1 text-sm text-gray-900">{user.country || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="mt-1 text-sm text-gray-900">{user.company || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Contact</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.salesContactAllowed ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Demo Access removed: demos are managed via general Demos page */}
          </div>
        </div>
      </div>
    </div>
  );
}
