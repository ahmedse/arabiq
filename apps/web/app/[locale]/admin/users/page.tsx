import { isAdmin } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';
import AdminUsersClient from './admin-users-client';

export default async function AdminUsersPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/en/access-denied');
  }

  return <AdminUsersClient />;
}
