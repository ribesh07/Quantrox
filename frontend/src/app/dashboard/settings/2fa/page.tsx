"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function TwoFactorPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // fetch current 2FA status
    (async () => {
      const res = await fetch('/api/2fa/status');
      if (res.ok) {
        const j = await res.json();
        setEnabled(j.enabled);
      }
    })();
  }, []);

  const handleEnable = async () => {
    const res = await fetch('/api/2fa/setup');
    if (!res.ok) return alert('Failed to generate 2FA setup');
    const j = await res.json();
    setSecret(j.secret);
    setQr(j.qrCode);
  };

  const handleVerify = async () => {
    if (!secret) return alert('Missing secret');
    const res = await fetch('/api/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret, token: code }) });
    if (!res.ok) return alert('Verification failed');
    const j = await res.json();
    setEnabled(true);
    alert('2FA enabled. Backup codes: ' + (j.backupCodes || []).join(', '));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      {!enabled ? (
        <div className="space-y-4">
          {qr ? (
            <div>
              <div className="w-40 h-40 relative">
                <Image src={qr} alt="QR" fill className="object-contain" />
              </div>
              <p className="mt-2">Scan the QR into your authenticator app and enter the code below.</p>
              <Input placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
              <Button onClick={handleVerify}>Verify & Enable</Button>
            </div>
          ) : (
            <Button onClick={handleEnable}>Enable 2FA</Button>
          )}
        </div>
      ) : (
        <div>
          <p>2FA is enabled for your account.</p>
          <Button onClick={async () => { await fetch('/api/2fa/disable', { method: 'POST' }); setEnabled(false); }}>Disable 2FA</Button>
        </div>
      )}
    </div>
  );
}
