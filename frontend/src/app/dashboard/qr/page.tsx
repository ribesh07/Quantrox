"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, QrCode } from "lucide-react";
import { getMyQRCodesAction } from "@/actions/merchant.actions";

export default function MerchantQRPage() {
  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ["my-qr-codes"],
    queryFn: async () => {
      const result = await getMyQRCodesAction();
      return result.success ? result.qrCodes : [];
    },
  });

  const activeQRs = qrCodes?.filter((qr: any) => qr.active) || [];
  const inactiveQRs = qrCodes?.filter((qr: any) => !qr.active) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading QR codes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Deposit QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Use these QR codes for accepting deposits via different payment methods
        </p>
      </div>

      {activeQRs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeQRs.map((qr: any) => (
            <Card key={qr.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{qr.label || "Deposit QR"}</CardTitle>
                  <Badge className="bg-green-500/10 text-green-600">Active</Badge>
                </div>
                {qr.paymentMethod && (
                  <CardDescription>{qr.paymentMethod.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <img
                  src={qr.imageUrl}
                  alt={qr.label || "Deposit QR Code"}
                  className="w-48 h-48 object-contain border rounded-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Assigned on {new Date(qr.assignedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-md mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
            <div className="text-center">
              <h3 className="font-bold text-lg">No QR Code Assigned</h3>
              <p className="text-sm text-muted-foreground">
                Contact admin to get your deposit QR codes assigned
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {inactiveQRs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Disabled QR Codes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveQRs.map((qr: any) => (
              <Card key={qr.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{qr.label || "Deposit QR"}</CardTitle>
                    <Badge variant="destructive">Disabled</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <img
                    src={qr.imageUrl}
                    alt={qr.label || "QR"}
                    className="w-32 h-32 object-contain border rounded-lg grayscale"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
