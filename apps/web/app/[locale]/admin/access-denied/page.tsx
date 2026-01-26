import Link from 'next/link';

export default function AccessDeniedPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  return (
    <div style={{padding: 40}}>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
      <p>
        <Link href={`/${locale}/login`}>Sign in</Link>
      </p>
    </div>
  );
}