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
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Copy, Info, Upload, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PaymentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${params.id}`);
      return res.json();
    },
  });

  const { data: qrCodes } = useQuery({
    queryKey: ["qr-codes-active"],
    queryFn: async () => {
      const res = await fetch("/api/admin/qr-codes/active");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/orders/${params.id}/proof`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment proof submitted successfully");
      router.push("/dashboard/orders");
    },
    onError: () => {
      toast.error("Failed to upload proof");
      setUploading(false);
    },
  });

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a screenshot");
      return;
    }
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    uploadMutation.mutate(formData);
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return <div>Order not found</div>;

  const activeQR = qrCodes?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complete Payment</h1>
          <p className="text-muted-foreground">Order ID: <span className="font-mono text-xs">{order.id}</span></p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Scan to Pay
              </CardTitle>
              <CardDescription>
                Scan the QR code with your Cash App to pay the exact amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-8 py-10">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                {activeQR ? (
                  <div className="relative aspect-square w-64 md:w-80 overflow-hidden rounded-3xl border-4 border-background bg-white shadow-2xl p-4">
                    <Image
                      src={activeQR.image}
                      alt="Payment QR"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-64 md:w-80 flex flex-col items-center justify-center bg-muted rounded-3xl border-2 border-dashed">
                    <Info className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm text-center px-6">
                      No active QR code available. <br />Please contact support.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md space-y-4">
                <div className="bg-muted/50 p-6 rounded-2xl space-y-4 border">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Payment Instructions</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                      <span>Open your <b>Cash App</b> and tap the QR scanner.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
                      <span>Scan the code and enter <b>${order.amount.toFixed(2)}</b>.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
                      <span>Take a screenshot of the <b>Completed</b> payment screen.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Summary & Proof */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm opacity-80">Order Type</span>
                <span className="font-bold capitalize">{order.type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm opacity-80">Exchange Rate</span>
                <span className="font-bold">1 USD = {order.rate} {order.type === 'EXCHANGE' ? 'USDT' : 'Credits'}</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-lg font-bold">Total to Pay</span>
                <span className="text-3xl font-black">${order.amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Submit Proof</CardTitle>
              <CardDescription>Upload your screenshot to complete the order.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpload}>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="screenshot" className="text-sm font-semibold">Confirmation Screenshot</Label>
                  <div 
                    onClick={() => document.getElementById("screenshot")?.click()}
                    className={cn(
                      "group relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                      selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-full transition-colors",
                      selectedFile ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {selectedFile ? <Check className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">
                        {selectedFile ? selectedFile.name : "Choose or drag screenshot"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG or JPEG up to 10MB</p>
                    </div>
                    <Input
                      id="screenshot"
                      name="screenshot"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="note" className="text-sm font-semibold">Optional Note</Label>
                  <Input 
                    id="note" 
                    name="note" 
                    placeholder="e.g. Last 4 digits of Cash App ID" 
                    className="h-12 rounded-xl border-2"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" 
                  type="submit" 
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading Proof...
                    </>
                  ) : (
                    "Submit Payment Proof"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-4 flex gap-4 text-sm text-yellow-600 dark:text-yellow-400">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Once submitted, our team will verify your payment. This usually takes <b>5-15 minutes</b>. You will be notified once the status changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
