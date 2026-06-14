"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, QrCode } from "lucide-react";
import { getMyQRCodeAction } from "@/actions/merchant.actions";

export default function MerchantQRPage() {
  const { data: qrCode, isLoading } = useQuery({
    queryKey: ["my-qr-code"],
    queryFn: async () => {
      const result = await getMyQRCodeAction();
      return result.success ? result.qrCode : null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading QR code...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Deposit QR Code</h1>
        <p className="text-muted-foreground mt-1">Use this QR code for accepting deposits</p>
      </div>

      {qrCode && qrCode.active ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Your Deposit QR Code</CardTitle>
            <CardDescription>Present this QR code to your customers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <img
              src={qrCode.imageUrl}
              alt="Deposit QR Code"
              className="w-64 h-64 object-contain border rounded-lg"
            />
            <p className="text-sm text-muted-foreground">
              Assigned on {new Date(qrCode.assignedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
            <div className="text-center">
              <h3 className="font-bold text-lg">No QR Code Assigned</h3>
              <p className="text-sm text-muted-foreground">
                Contact admin to get your deposit QR code assigned
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
