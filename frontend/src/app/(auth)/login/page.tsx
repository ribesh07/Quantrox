"use client";

import { Button } from "@/components/ui/button";
import { getSession, signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"password" | "2fa">("password");
  const [temporaryToken, setTemporaryToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const showRegisteredMessage = searchParams.get("registered") === "true";

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const emailValue = (formData.get("email") as string)?.trim();
    const passwordValue = (formData.get("password") as string) ?? "";
    setEmail(emailValue);

    if (!emailValue || !passwordValue) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Check if we need to go to 2FA step
      const session = await getSession();
      const sessionUser = session?.user as any;
      if (sessionUser?.requiresTwoFactor && sessionUser?.temporaryToken) {
        setTemporaryToken(sessionUser.temporaryToken);
        setStep("2fa");
        // Sign out the temporary session to avoid conflicts
        await signOut({ redirect: false });
        setLoading(false);
        return;
      }

      // No 2FA, proceed
      const role = sessionUser?.role;
      if (
        role === "USER" 
      ) {
        router.push("/dashboard");
      } else {
        setError("Unauthorized access");
        router.replace("/login");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const codeValue = (formData.get("code") as string)?.trim();

    if (!codeValue || !temporaryToken) {
      setError("Please enter the verification code");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        temporaryToken,
        code: codeValue,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid verification code");
        setLoading(false);
        return;
      }

      const session = await getSession();
      const role = (session?.user as any)?.role;
     if (
        role === "USER" 
      ) {
        router.push("/dashboard");
      } else {
        setError("Unauthorized access");
        router.replace("/login");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E11] px-4 py-6 sm:py-10">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1E2329]">
        <div className="h-2 bg-primary" />
        {step === "password" ? (
          <>
            <CardHeader className="space-y-2 px-5 pt-6 sm:px-6 sm:pt-8">
              <CardTitle className="text-2xl sm:text-3xl font-black text-white">Login</CardTitle>
              <CardDescription className="text-sm sm:text-base text-[#848E9C]">
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-5 px-5 sm:space-y-6 sm:px-6">
                {showRegisteredMessage && !error && (
                  <div className="rounded-xl bg-[#0ECB81]/10 p-4 text-sm text-[#0ECB81] border border-[#0ECB81]/30 font-medium">
                    Registration successful. You can log in now.
                  </div>
                )}
                {error && (
                  <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#EAECEF]">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all placeholder:text-[#474D57]"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" title="Password" className="text-sm font-semibold text-[#EAECEF]">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs sm:text-sm text-primary hover:underline font-bold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-5 px-5 pb-8 sm:space-y-6 sm:px-6 sm:pb-10">
  <Button
    className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
    type="submit"
    disabled={loading}
  >
    {loading ? "Logging in..." : "Login"}
  </Button>

  <p className="text-center text-sm text-[#848E9C]">
    Don't have an account?{" "}
    <a
      href="https://t.me/nist_ieo"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary hover:underline"
    >
      Click here
    </a>
  </p>
</CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 px-5 pt-6 sm:px-6 sm:pt-8">
              <CardTitle className="text-2xl sm:text-3xl font-black text-white">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-sm sm:text-base text-[#848E9C]">
                Enter the verification code from your authenticator app
              </CardDescription>
            </CardHeader>
            <form onSubmit={handle2FASubmit}>
              <CardContent className="space-y-5 px-5 sm:space-y-6 sm:px-6">
                {error && (
                  <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                    {error}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-[#848E9C]">
                    Email: {email}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("password");
                      setTemporaryToken(null);
                      setEmail("");
                    }}
                    className="mt-2 text-primary hover:underline font-medium"
                  >
                    Change email
                  </button>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-sm font-semibold text-[#EAECEF]">Verification Code</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all placeholder:text-[#474D57]"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-5 px-5 pb-8 sm:space-y-6 sm:px-6 sm:pb-10">
                <Button className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0E11] text-[#848E9C]">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}