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
import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-4 pt-8">
          <Button variant="ghost" size="sm" asChild className="w-fit rounded-full -ml-2">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </Button>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black">Reset Password</CardTitle>
            <CardDescription className="text-base">
              Enter your email and we&apos;ll send you instructions to reset your password.
            </CardDescription>
          </div>
        </CardHeader>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-muted p-1.5 rounded-lg group-focus-within:bg-primary/10 transition-colors">
                    <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-14 h-14 rounded-2xl border-2 transition-all focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8 pt-4">
              <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Instructions...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
            <div className="bg-green-500/10 p-6 rounded-full">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Check your email</h3>
              <p className="text-muted-foreground">
                We have sent a password reset link to your email address. Please check your inbox and spam folder.
              </p>
            </div>
            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold" onClick={() => setSubmitted(false)}>
              Try another email
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
