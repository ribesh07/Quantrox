"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, RefreshCw, ToggleLeft, ToggleRight, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  assignMerchantQRCodeAction,
  assignMultipleMerchantQRCodesAction,
  disableMerchantQRCodeAction,
  enableMerchantQRCodeAction,
  getAllMerchantQRCodesAction,
  replaceMerchantQRCodeAction,
} from "@/actions/admin.actions";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminMerchantQRCodesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [qrs, setQrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState("");
  const [label, setLabel] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadQRCodes();
    }
  }, [status, router]);

  const loadQRCodes = async () => {
    setLoading(true);
    const result = await getAllMerchantQRCodesAction();
    if (result.success) {
      setQrs(result.qrs || []);
    } else {
      toast.error(result.error || "Failed to load merchant QR codes");
    }
    setLoading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (bulkMode) {
      setSelectedFiles(files);
      setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
      return;
    }

    const file = files[0] || null;
    setSelectedFiles(file ? [file] : []);
    setPreviewUrls(file ? [URL.createObjectURL(file)] : []);
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId.trim() || selectedFiles.length === 0) {
      toast.error("Please enter a merchant user ID and choose at least one image");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (bulkMode) {
        selectedFiles.forEach((file) => formData.append("images", file));
        if (label.trim()) formData.append("labels", label.trim());
        const result = await assignMultipleMerchantQRCodesAction(userId.trim(), formData);
        if (!result.success) throw new Error(result.error || "Failed to assign QR codes");
        toast.success(`${result.count || selectedFiles.length} merchant QR code${selectedFiles.length > 1 ? "s" : ""} assigned`);
      } else {
        formData.append("image", selectedFiles[0]);
        if (label.trim()) formData.append("label", label.trim());
        const result = await assignMerchantQRCodeAction(userId.trim(), formData);
        if (!result.success) throw new Error(result.error || "Failed to assign QR code");
        toast.success("Merchant QR code assigned");
      }

      setUserId("");
      setLabel("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadQRCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign QR code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (qrId: string, active: boolean) => {
    const result = active
      ? await enableMerchantQRCodeAction(qrId)
      : await disableMerchantQRCodeAction(qrId);

    if (result.success) {
      toast.success(active ? "QR code enabled" : "QR code disabled");
      await loadQRCodes();
    } else {
      toast.error(result.error || "Failed to update QR code status");
    }
  };

  const handleReplace = async (qrId: string, file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const result = await replaceMerchantQRCodeAction(qrId, formData);
    if (result.success) {
      toast.success("QR code replaced");
      await loadQRCodes();
    } else {
      toast.error(result.error || "Failed to replace QR code");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Merchant QR Codes</h1>
        <p className="text-sm text-muted-foreground">Assign and manage deposit QR codes for merchants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign QR Code</CardTitle>
          <CardDescription>Upload a new QR image for a merchant account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Merchant User ID</Label>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter merchant user id" required />
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional label" />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <input
                type="checkbox"
                id="bulk-upload"
                checked={bulkMode}
                onChange={(e) => {
                  setBulkMode(e.target.checked);
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Label htmlFor="bulk-upload">Upload multiple QR images</Label>
            </div>

            <div className="space-y-2">
              <Label>{bulkMode ? "QR Images" : "QR Image"}</Label>
              <Input ref={fileInputRef} type="file" accept="image/*" multiple={bulkMode} onChange={handleFileChange} required />
            </div>

            {previewUrls.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previewUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="rounded-lg border p-3">
                    <img src={url} alt={`Preview ${index + 1}`} className="h-40 w-full object-contain" />
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign QR
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing QR Codes</CardTitle>
          <CardDescription>Enable, disable, or replace QR images assigned to merchants.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : qrs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No merchant QR codes have been assigned yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {qrs.map((qr) => (
                <div key={qr.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        <span className="font-medium">{qr.label || "Merchant QR"}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{qr.user?.email || qr.user?.username || qr.userId}</p>
                    </div>
                    <Badge className={qr.active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground"}>
                      {qr.active ? "Active" : "Disabled"}
                    </Badge>
                  </div>

                  <img src={resolveMediaUrl(qr.imageUrl)} alt={qr.label || "Merchant QR"} className="h-40 w-full rounded-md border object-contain bg-muted/30" />

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleToggle(qr.id, !qr.active)}>
                      {qr.active ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                      {qr.active ? "Disable" : "Enable"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`replace-${qr.id}`)?.click()}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Replace
                    </Button>
                    <input
                      id={`replace-${qr.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleReplace(qr.id, event.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
