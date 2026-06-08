"use client";

import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E11] px-4 py-12">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-[#1E2329]">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-2 pt-8">
          <CardTitle className="text-3xl font-black text-white">Login</CardTitle>
          <CardDescription className="text-[#848E9C]">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
                className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all placeholder:text-[#474D57]"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="text-sm font-semibold text-[#EAECEF]">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pb-10">
            <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm text-[#848E9C]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-bold">
                Register Now
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
