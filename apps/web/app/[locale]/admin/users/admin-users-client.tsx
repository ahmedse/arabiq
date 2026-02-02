'use client';

import { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { Search, Users, CheckCircle, XCircle, Clock, Filter, RefreshCw, Mail } from 'lucide-react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  company?: string;
  accountStatus?: string;
  confirmed?: boolean;
  role?: { id: number; name: string; type: string };
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  type: string;
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = Cookies.get('strapi_jwt');
    if (!token) return;

    try {
      // Load users
      const usersRes = await fetch(`${STRAPI_URL}/api/user-management/users?populate=role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }

      // Load roles
      const rolesRes = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    const token = Cookies.get('strapi_jwt');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/user-management/elevate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, roleId, reason: 'Admin role change' }),
      });

      if (res.ok) {
        await loadData();
        toast.success('Role updated successfully');
      } else {
        toast.error('Failed to update role');
      }
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, status: string) => {
    const token = Cookies.get('strapi_jwt');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/user-management/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, status }),
      });

      if (res.ok) {
        await loadData();
        const statusText = status === 'active' ? 'approved' : status;
        toast.success(`User ${statusText} successfully`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.company?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;
      
      // Confirmed filter
      const matchesConfirmed = !showConfirmedOnly || user.confirmed === true;
      
      return matchesSearch && matchesStatus && matchesConfirmed;
    });
  }, [users, searchQuery, statusFilter, showConfirmedOnly]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    pending: users.filter(u => u.accountStatus === 'pending').length,
    active: users.filter(u => u.accountStatus === 'active').length,
    suspended: users.filter(u => u.accountStatus === 'suspended').length,
  }), [users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              User Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage user accounts, roles, and access permissions
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.suspended}</p>
                <p className="text-xs text-red-600">Suspended</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showConfirmedOnly}
                  onChange={(e) => setShowConfirmedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Confirmed only
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.accountStatus === 'pending' ? 'bg-amber-50/50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {user.username}
                          {user.confirmed && <Mail className="w-3 h-3 text-green-500" aria-label="Email confirmed" />}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role?.id}
                      onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                      disabled={actionLoading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.accountStatus || 'pending'}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      disabled={actionLoading}
                      className={`text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 ${
                        user.accountStatus === 'active' ? 'border-green-300 bg-green-50 text-green-700' :
                        user.accountStatus === 'suspended' ? 'border-red-300 bg-red-50 text-red-700' :
                        'border-amber-300 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="active">✅ Active</option>
                      <option value="suspended">🚫 Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'No users match your filters' 
                : 'No users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
