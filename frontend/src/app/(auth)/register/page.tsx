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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUserAction } from "@/actions/auth.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string) ?? "";
    const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await registerUserAction({ username, email, password });

      if (!result.success) {
        setError(result.error || "Registration failed");
      } else {
        router.push("/login?registered=true");
      }
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
          <CardTitle className="text-2xl sm:text-3xl font-black text-white">Register</CardTitle>
          <CardDescription className="text-sm sm:text-base text-[#848E9C]">
            Create an account to start exchanging and gaming
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-5 sm:space-y-6 sm:px-6">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-semibold text-[#EAECEF]">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                autoComplete="username"
                className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all placeholder:text-[#474D57]"
                required
              />
            </div>
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
              <Label htmlFor="password" title="Password" className="text-sm font-semibold text-[#EAECEF]">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="new-password"
                className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all"
                required 
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" title="Confirm Password" className="text-sm font-semibold text-[#EAECEF]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="h-12 sm:h-14 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary focus:ring-0 transition-all"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 px-5 pb-8 sm:space-y-6 sm:px-6 sm:pb-10">
            <Button className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
            <div className="text-center text-sm text-[#848E9C]">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-bold">
                Login Now
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
