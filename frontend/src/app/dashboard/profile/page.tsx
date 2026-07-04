"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Loader2, Save, Key } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCurrentUserAction } from "@/actions/auth.actions";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Profile updated successfully!");
    }, 1000);
  };

  const fetchuserdetails = async () => {
    if (session) {
      try {
        const res = await getCurrentUserAction();
        if (res.success) {
          setUser(res.user);
        }
      } catch (err: any) {
        console.error("Error fetching user data:", err);
      }
    }
  };

  useEffect(() => {
    if (session) {
      fetchuserdetails();
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information and security preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Sidebar */}
        <Card className="md:col-span-1 border-none shadow-xl bg-card/50 backdrop-blur-sm h-fit overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="flex flex-col items-center -mt-12 space-y-4 pb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                {(user?.username?.[0]?.toUpperCase() || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-bold text-lg">{user?.username}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                  {(user?.role || "").replace("_", " ")}
                </p>
                {user?.twoFactorEnabled && (
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                    <Shield className="h-3 w-3" />
                    <span className="text-[10px] font-bold">2FA</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full space-y-2 pt-4">
              <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/50 border">
                <Mail className="h-4 w-4 text-primary" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Forms */}
        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic profile details.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="username" 
                        defaultValue={user?.username || ""} 
                        className="pl-10 h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue={user?.email || ""} 
                        className="pl-10 h-12 rounded-xl border-2"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 pt-6">
                <Button type="submit" className="rounded-xl px-8 font-bold ml-auto" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password and secure your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="current_password" className="text-sm font-semibold">Current Password</Label>
                <Input id="current_password" type="password" className="h-12 rounded-xl border-2" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="new_password" className="text-sm font-semibold">New Password</Label>
                  <Input id="new_password" type="password" className="h-12 rounded-xl border-2" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm_password" className="text-sm font-semibold">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" className="h-12 rounded-xl border-2" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 pt-6">
              <Button variant="outline" className="rounded-xl px-8 font-bold ml-auto border-2">
                <Key className="mr-2 h-4 w-4" /> Update Password
              </Button>
            </CardFooter>
          </Card>

          {/* 2FA Section */}
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Protect your account with 2FA using Google Authenticator, Microsoft Authenticator, or similar apps.
              </p>
              <Button asChild>
                <Link href="/dashboard/settings/2fa">
                  <Shield className="mr-2 h-4 w-4" /> Manage 2FA
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}