"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ResetPasswordPage({ searchParams }: any) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = (searchParams && searchParams.token) || new URLSearchParams(window.location.search).get('token');
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return alert('Missing token');
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = formData.get('password');
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      if (!res.ok) throw new Error('Reset failed');
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold">Password reset</h2>
          <p className="mt-4">Your password has been reset. <Link href="/login" className="text-primary font-bold">Login</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </div>
          <div className="mt-6">
            <Button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
