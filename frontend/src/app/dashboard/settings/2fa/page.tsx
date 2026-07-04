"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function TwoFactorPage() {
  const router = useRouter();
  const [step, setStep] = useState<"status" | "setup" | "enabled">("status");
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const session = await getSession();
    const token = (session?.user as any)?.accessToken;
    if (!token) {
      await signOut();
      router.push("/login");
      return null;
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    const checkStatus = async () => {
      const headers = await getAuthHeaders();
      if (!headers) return;

      // We don't have a status endpoint anymore, but we can just start with status step
      setStep("status");
    };
    checkStatus();
  }, []);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;

      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to setup 2FA");
        return;
      }
      const data = await res.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep("setup");
    } catch (err) {
      console.error(err);
      alert("Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!secret || !code || !password) {
      alert("Please enter all fields");
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;

      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers,
        body: JSON.stringify({ secret, code, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Verification failed");
        return;
      }
      const data = await res.json();
      setBackupCodes(data.backupCodes);
      setStep("enabled");
    } catch (err) {
      console.error(err);
      alert("Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!code || !password) {
      alert("Please enter your password and 2FA code");
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;

      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers,
        body: JSON.stringify({ password, code }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to disable 2FA");
        return;
      }
      setStep("status");
      setSecret(null);
      setQrCode(null);
      setBackupCodes(null);
    } catch (err) {
      console.error(err);
      alert("Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "2fa-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen p-6 bg-[#0B0E11]">
      <Card className="max-w-lg mx-auto bg-[#1E2329] border-none shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-white">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-[#848E9C]">
            Secure your account with 2FA using Google Authenticator, Authy, or similar apps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "status" && (
            <div className="space-y-4">
              <p className="text-white">2FA is currently disabled. Enable it for added security.</p>
              <Button onClick={handleStartSetup} disabled={loading}>
                {loading ? "Setting up..." : "Enable 2FA"}
              </Button>
            </div>
          )}
          {step === "setup" && (
            <div className="space-y-4">
              {qrCode && (
                <div className="flex justify-center">
                  <div className="w-48 h-48 relative bg-white p-2 rounded-lg">
                    <Image src={qrCode} alt="QR Code" fill className="object-contain" />
                  </div>
                </div>
              )}
              {secret && (
                <div className="p-3 bg-[#2B3139] rounded-lg">
                  <p className="text-xs text-[#848E9C] mb-1">Manual entry code:</p>
                  <p className="text-white font-mono">{secret}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#EAECEF]">Confirm your password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-[#2B3139] border-[#2B3139] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-[#EAECEF]">Enter 6-digit code from your authenticator app</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="bg-[#2B3139] border-[#2B3139] text-white"
                />
              </div>
              <Button onClick={handleEnable} disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Enable 2FA"}
              </Button>
            </div>
          )}
          {step === "enabled" && backupCodes && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0ECB81]/10 border border-[#0ECB81]/30 rounded-lg">
                <h3 className="text-lg font-bold text-[#0ECB81] mb-2">Backup Codes</h3>
                <p className="text-[#848E9C] text-sm mb-3">
                  Save these backup codes in a secure location! They will not be shown again.
                  Each code can be used once.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="p-2 bg-[#2B3139] rounded font-mono text-white text-center text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadBackupCodes} className="flex-1">
                  Download Backup Codes
                </Button>
                <Button onClick={() => router.push("/dashboard")} variant="secondary">
                  Done
                </Button>
              </div>
              <div className="border-t border-[#2B3139] pt-4 space-y-2">
                <h4 className="text-white font-semibold">Disable 2FA</h4>
                <p className="text-[#848E9C] text-sm">If you need to disable 2FA, enter your password and a code below.</p>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#2B3139] border-[#2B3139] text-white"
                  />
                  <Input
                    placeholder="Enter 2FA code or backup code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-[#2B3139] border-[#2B3139] text-white"
                  />
                </div>
                <Button onClick={handleDisable} disabled={loading} variant="destructive">
                  {loading ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
