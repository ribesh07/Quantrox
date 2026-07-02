"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, QrCode } from "lucide-react";
import { getMyQRCodeAction } from "@/actions/merchant.actions";
import { resolveMediaUrl } from "@/lib/media";

export default function MerchantQRPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-qr-codes"],
    queryFn: async () => {
      const result = await getMyQRCodeAction();
      if (!result.success) return { qrCodes: [], qrCode: null };
      return { qrCodes: result.qrCodes || [], qrCode: result.qrCode };
    },
  });

  const qrCodes = data?.qrCodes || [];
  const activeQRs = qrCodes.filter((qr: any) => qr.active);

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
          {activeQRs.length > 0
            ? `You have ${activeQRs.length} active QR code${activeQRs.length !== 1 ? "s" : ""}`
            : "Use these QR codes for accepting deposits"}
        </p>
      </div>

      {activeQRs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr: any) => (
            <Card key={qr.id} className={!qr.active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{qr.label || "Deposit QR"}</CardTitle>
                  {qr.active ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <CardDescription>
                  Assigned on {new Date(qr.assignedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <img
                  src={resolveMediaUrl(qr.imageUrl)}
                  alt={qr.label || "Deposit QR Code"}
                  className="w-48 h-48 object-contain border rounded-lg"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : qrCodes.length > 0 ? (
        <Card className="max-w-md mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
            <div className="text-center">
              <h3 className="font-bold text-lg">All QR Codes Disabled</h3>
              <p className="text-sm text-muted-foreground">
                Contact admin to re-enable your deposit QR codes
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <QrCode className="h-12 w-12 text-yellow-600" />
            <div className="text-center">
              <h3 className="font-bold text-lg">No QR Codes Assigned</h3>
              <p className="text-sm text-muted-foreground">
                Contact admin to get your deposit QR codes assigned
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
