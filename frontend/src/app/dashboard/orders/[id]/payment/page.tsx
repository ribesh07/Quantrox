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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Info, Upload, Loader2, ArrowLeft, ShieldCheck, QrCode } from "lucide-react";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { getOrderByIdAction, uploadOrderProofAction } from "@/actions/order.actions";

export default function OrderDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: async () => {
       const res = await getOrderByIdAction(params.id);
      if (!res.success) throw new Error("Failed to load order");
      return res.order;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await uploadOrderProofAction(params.id, formData);
      if (!res.success) throw new Error(res.error || "Upload failed");
      return res.order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
      toast.success("Payment proof submitted successfully");
      setUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload proof");
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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

  if (!order) return <div className="text-center py-20">Order not found</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-green-500 font-bold">Completed</span>;
      case "PENDING_REVIEW":
        return <span className="text-yellow-500 font-bold">Pending Review</span>;
      case "PENDING_PAYMENT":
        return <span className="text-blue-500 font-bold">Awaiting Payment</span>;
      case "REJECTED":
        return <span className="text-red-500 font-bold">Rejected</span>;
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">ID: <span className="font-mono text-xs">{order.id}</span></p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          {order.status === "PENDING_PAYMENT" && (order.type === "DEPOSIT" || order.type === "EXCHANGE" || order.type === "GAME_TOPUP") && (
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Scan to Pay
                </CardTitle>
                <CardDescription>
                  Scan the QR code to pay the exact amount for this {order.type.toLowerCase()}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-8 py-10">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  {order.paymentMethod?.qrCode ? (
                    <div className="relative aspect-square w-64 md:w-80 overflow-hidden rounded-3xl border-4 border-background bg-white shadow-2xl p-4">
                      <Image
                        src={resolveMediaUrl(order.paymentMethod.qrCode)}
                        alt="Payment QR"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-64 md:w-80 flex flex-col items-center justify-center bg-muted rounded-3xl border-2 border-dashed">
                      <QrCode className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-sm text-center px-6">
                        No QR code available for this method. <br />Please contact support.
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-md space-y-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground uppercase font-black tracking-widest mb-1">Pay to this account</p>
                    <p className="text-xl font-bold">{order.paymentMethod?.details || "See instructions below"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {order.proofImage && (
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Submitted Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black">
                  <Image
                    src={resolveMediaUrl(order.proofImage)}
                    alt="Payment Proof"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {order.adminNote && (
            <Card className="border-red-200 bg-red-50 text-red-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" /> Admin Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.adminNote}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm opacity-80">Type</span>
                <span className="font-bold capitalize">{order.type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm opacity-80">Method</span>
                <span className="font-bold">{order.paymentMethod?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm opacity-80">Status</span>
                <span className="font-bold">{getStatusBadge(order.status)}</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-lg font-bold">Amount</span>
                <span className="text-3xl font-black">${order.amount.toFixed(2)}</span>
              </div>
              <div className="pt-2 flex justify-between items-center bg-white/10 p-3 rounded-xl">
                <span className="text-xs font-black uppercase">To Receive</span>
                <span className="font-black">
                  {order.receivedAmount.toFixed(2)} {order.type === 'EXCHANGE' ? 'USDT' : 'Points'}
                </span>
              </div>
            </CardContent>
          </Card>

          {(order.status === "PENDING_PAYMENT" || order.status === "REJECTED") && (
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle>{order.screenshot ? "Update Proof" : "Submit Proof"}</CardTitle>
                <CardDescription>Upload a screenshot of your transaction.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpload}>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div 
                      onClick={() => document.getElementById("screenshot")?.click()}
                      className={cn(
                        "group relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                        previewUrl ? "border-primary bg-primary/5 aspect-video" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 h-40"
                      )}
                    >
                      {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
                      ) : (
                        <>
                          <div className="p-4 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Upload className="h-8 w-8" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm">Click to upload screenshot</p>
                          </div>
                        </>
                      )}
                      <input
                        id="screenshot"
                        name="screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        required
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90" 
                    type="submit" 
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      order.screenshot ? "Update Proof" : "Submit Proof"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
