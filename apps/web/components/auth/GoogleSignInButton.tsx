"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
    >
      Continue with Google
    </button>
  );
}
