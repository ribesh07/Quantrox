"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, UploadCloud, Eye, ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyPayoutRequestsAction, createPayoutRequestAction } from "@/actions/merchant.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";
import { PayoutStatus } from "@/lib/prisma-types";

export default function UserPayoutsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailPayout, setDetailPayout] = useState<any>(null);

  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [uid, setUid] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payout-methods"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction();
      if (!result.success) throw new Error(result.error);
      return result.methods?.filter((m: any) => m.category !== "EXCHANGE") ?? [];
    },
  });

  const selectedMethod = methods?.find((m: any) => m.id === paymentMethodId);

  const { data, isLoading } = useQuery({
    queryKey: ["my-payouts"],
    queryFn: async () => {
      const result = await getMyPayoutRequestsAction();
      return result.success ? result.payouts : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("paymentMethodId", paymentMethodId);
      formData.append("uid", uid);
      formData.append("remarks", remarks);
      if (file) {
        formData.append("qrCodeImage", file);
      }
      const result = await createPayoutRequestAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-payouts"] });
      toast.success("Payout request submitted!");
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setAmount("");
    setPaymentMethodId("");
    setUid("");
    setRemarks("");
    setFile(null);
    setQrPreview(null);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);
    setQrPreview(URL.createObjectURL(uploaded));
  };

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case PayoutStatus.PAID:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Paid</Badge>;
      case PayoutStatus.APPROVED:
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full px-3">Approved</Badge>;
      case PayoutStatus.UNDER_REVIEW:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 rounded-full px-3">Under Review</Badge>;
      case PayoutStatus.REJECTED:
        return <Badge variant="destructive" className="rounded-full px-3">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">Pending</Badge>;
    }
  };

  const canSubmit =
    paymentMethodId &&
    amount &&
    uid.trim() &&
    file &&
    !createMutation.isPending;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Choose a payment method, upload your receiving QR, and submit a payout request
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Payout Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Payout Request</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={methodsLoading ? "Loading..." : "Select payment method"} />
                  </SelectTrigger>
                  <SelectContent>
                    {methods?.map((method: any) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMethod && (
                  <p className="text-xs text-muted-foreground">
                    Min: ${selectedMethod.minAmount} · Max: ${selectedMethod.maxAmount}
                    {selectedMethod.feePercentage > 0 && ` · Fee: ${selectedMethod.feePercentage}%`}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={selectedMethod?.minAmount ?? 0}
                  max={selectedMethod?.maxAmount ?? undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>UID / Account ID</Label>
                <Input
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Your payment UID, cashtag, or account ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Receiving QR Code</Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center">
                  {qrPreview ? (
                    <div className="space-y-2">
                      <img src={qrPreview} alt="QR preview" className="mx-auto h-32 w-32 object-contain rounded-lg" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setQrPreview(null); }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      <UploadCloud className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload receiving QR</span>
                      <Input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} required />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Information (Optional)</Label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any extra details for the admin"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!canSubmit}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">My Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payouts...</p>
            </div>
          ) : !data?.length ? (
            <p className="text-center text-sm text-muted-foreground py-10">No payout requests yet.</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((payout: any) => (
                      <TableRow key={payout.id}>
                        <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{payout.paymentMethod?.name || payout.walletNetwork || "-"}</TableCell>
                        <TableCell>${payout.amount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">{payout.uid || payout.walletAddress || "-"}</TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>
                          {payout.paymentProofImage ? (
                            <ImageIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setDetailPayout(payout)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {data.map((payout: any) => (
                  <div key={payout.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">${payout.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {payout.paymentMethod?.name || payout.walletNetwork} · {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-sm font-mono break-all">
                      <span className="text-muted-foreground font-sans">UID: </span>{payout.uid || payout.walletAddress}
                    </p>
                    {payout.rejectionReason && (
                      <p className="text-sm text-destructive">Rejected: {payout.rejectionReason}</p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setDetailPayout(payout)}>
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailPayout} onOpenChange={(v) => !v && setDetailPayout(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
          </DialogHeader>
          {detailPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(detailPayout.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">${detailPayout.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p>{detailPayout.paymentMethod?.name || detailPayout.walletNetwork || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UID</p>
                  <p className="font-mono text-xs break-all">{detailPayout.uid || detailPayout.walletAddress}</p>
                </div>
              </div>
              {detailPayout.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Additional Info</p>
                  <p className="text-sm">{detailPayout.remarks}</p>
                </div>
              )}
              {detailPayout.qrCodeImage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Receiving QR</p>
                  <img src={detailPayout.qrCodeImage} alt="Receiving QR" className="h-40 w-40 object-contain rounded-lg border" />
                </div>
              )}
              {detailPayout.paymentProofImage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof (from admin)</p>
                  <img src={detailPayout.paymentProofImage} alt="Payment proof" className="max-h-48 object-contain rounded-lg border" />
                  {detailPayout.transactionHash && detailPayout.transactionHash !== "N/A" && (
                    <p className="text-xs font-mono mt-2 break-all">Ref: {detailPayout.transactionHash}</p>
                  )}
                </div>
              )}
              {detailPayout.rejectionReason && (
                <p className="text-sm text-destructive">Rejection reason: {detailPayout.rejectionReason}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
