import Link from 'next/link';

export default function AdminIndex({ params }: { params: { locale: string } }) {
  return (
    <div style={{padding: 40}}>
      <h1>Admin panel</h1>
      <p><Link href={`/${params.locale}/admin/users`}>Manage users</Link></p>
    </div>
  );
}