export async function GET() {
  return new Response(JSON.stringify({
    NEXTAUTH_GOOGLE_ID: process.env.NEXTAUTH_GOOGLE_ID ?? null,
    NEXTAUTH_GOOGLE_SECRET: !!process.env.NEXTAUTH_GOOGLE_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
  }), { headers: { 'Content-Type': 'application/json' } });
}
