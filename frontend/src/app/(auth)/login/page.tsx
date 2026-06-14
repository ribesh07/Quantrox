"use client";

import { Button } from "@/components/ui/button";
import { getSession } from "next-auth/react";
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
  const showRegisteredMessage = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string) ?? "";

    if (!email || !password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      const session = await getSession();
      const role = (session?.user as any)?.role;

      if (
        role === "SUPER_ADMIN" ||
        role === "STAFF_ADMIN"
      ) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

router.refresh();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E11] px-4 py-6 sm:py-10">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1E2329]">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-2 px-5 pt-6 sm:px-6 sm:pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-black text-white">Login</CardTitle>
          <CardDescription className="text-sm sm:text-base text-[#848E9C]">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
            <Button className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            {/* <div className="text-center text-sm text-[#848E9C]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-bold">
                Register Now
              </Link>
            </div> */}
          </CardFooter>
        </form>
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
