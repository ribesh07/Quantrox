"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage({ searchParams }: any) {
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  useEffect(() => {
    const token = (searchParams && searchParams.token) || new URLSearchParams(window.location.search).get('token');
    if (!token) return setStatus('error');
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        if (!res.ok) throw new Error('Verification failed');
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {status === 'loading' && <p>Verifying your email...</p>}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold">Email verified</h2>
            <p className="mt-4">Your email has been verified. You can now <Link href="/login" className="text-primary font-bold">login</Link>.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold">Verification failed</h2>
            <p className="mt-4">The verification link is invalid or expired.</p>
          </>
        )}
        {status === 'idle' && (
          <>
            <h2 className="text-2xl font-bold">Verify Email</h2>
            <p className="mt-2">Starting verification...</p>
          </>
        )}
      </div>
    </div>
  );
}
