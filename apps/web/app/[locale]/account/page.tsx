import { getCurrentUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';
import AccountClient from './account-client';

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/en/login');
  }

  return <AccountClient user={user} />;
}
