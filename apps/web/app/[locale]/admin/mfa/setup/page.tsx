"use client";

import { useEffect, useState } from 'react';

export default function MFASetupPage({ params }: { params: { locale: string } }) {
  const [data, setData] = useState<any>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/${params.locale}/api/admin/mfa/secret`).then((r) => r.json()).then((d) => setData(d));
  }, [params.locale]);

  async function verify(e: any) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/${params.locale}/api/admin/mfa/verify`, { method: 'POST', body: JSON.stringify({ secret: data.secret, token: code }), headers: { 'Content-Type': 'application/json' } });
    const j = await res.json();
    if (!res.ok) setError(j.error || 'Verification failed');
    else window.location.href = `/${params.locale}/admin`;
  }

  if (!data) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin MFA Setup</h1>
      <p>Scan this QR code with your authenticator app, then enter the code to verify.</p>
      <img src={data.qrDataUrl} alt="MFA QR" style={{ width: 220, height: 220 }} />
      <p>Secret (store securely): <code>{data.secret}</code></p>
      <form onSubmit={verify}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        <button type="submit">Verify & Enable</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}