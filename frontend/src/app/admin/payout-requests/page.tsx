"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search, DollarSign, Eye, UploadCloud, Clock, CheckCheck, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  getAllPayoutRequestsAction,
  getPayoutStatusCountsAction,
  approvePayoutRequestAction,
  rejectPayoutRequestAction,
  markPayoutPaidAction,
} from "@/actions/admin.actions";
import { PayoutStatus } from "@/lib/prisma-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: PayoutStatus.PENDING, label: "Pending" },
  { value: PayoutStatus.UNDER_REVIEW, label: "Under Review" },
  { value: PayoutStatus.APPROVED, label: "Approved" },
  { value: PayoutStatus.PAID, label: "Paid" },
  { value: PayoutStatus.REJECTED, label: "Rejected" },
];

export default function AdminPayoutRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailPayout, setDetailPayout] = useState<any>(null);
  const [payingPayoutId, setPayingPayoutId] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [rejectingPayoutId, setRejectingPayoutId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: counts } = useQuery({
    queryKey: ["admin-payout-stats"],
    queryFn: async () => {
      const result = await getPayoutStatusCountsAction();
      return result.success ? result.counts : {};
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payout-requests", statusFilter],
    queryFn: async () => {
      const result = await getAllPayoutRequestsAction(statusFilter);
      if (!result.success) throw new Error(result.error);
      return result.payouts || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await approvePayoutRequestAction(id);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-stats"] });
      toast.success("Payout approved");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const result = await rejectPayoutRequestAction(id, reason);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-stats"] });
      toast.success("Payout rejected");
      setRejectingPayoutId(null);
      setRejectionReason("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, hash, file }: { id: string; hash: string; file: File }) => {
      const formData = new FormData();
      formData.append("paymentProof", file);
      formData.append("transactionHash", hash);
      const result = await markPayoutPaidAction(id, formData);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-stats"] });
      toast.success("Payout marked as paid");
      resetPayForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetPayForm = () => {
    setPayingPayoutId(null);
    setTransactionHash("");
    setProofFile(null);
    setProofPreview(null);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setProofFile(uploaded);
    setProofPreview(URL.createObjectURL(uploaded));
  };

  const filteredPayouts = Array.isArray(data)
    ? data.filter(
        (p: any) =>
          p.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
          p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          p.uid?.toLowerCase().includes(search.toLowerCase()) ||
          p.paymentMethod?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

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

  const pendingCount = (counts?.PENDING ?? 0) + (counts?.UNDER_REVIEW ?? 0) + (counts?.APPROVED ?? 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-muted-foreground mt-1">Review user payout requests and upload payment proof when paid</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Needs Action</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{counts?.APPROVED ?? 0}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{counts?.PAID ?? 0}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{counts?.REJECTED ?? 0}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">All Payout Requests</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, UID, method..."
                  className="pl-10 h-10 rounded-xl border-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  size="sm"
                  variant={statusFilter === tab.value ? "default" : "outline"}
                  className={cn("rounded-full", statusFilter === tab.value && "shadow-sm")}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}
                  {tab.value !== "ALL" && counts?.[tab.value] != null && (
                    <span className="ml-1.5 text-xs opacity-70">({counts[tab.value]})</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payouts...</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-20">No payout requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">Method</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">UID</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout: any) => (
                    <TableRow key={payout.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{payout.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{payout.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payout.paymentMethod?.name || payout.walletNetwork || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ${payout.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[140px] truncate">
                        {payout.uid || payout.walletAddress || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDetailPayout(payout)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          {(payout.status === PayoutStatus.PENDING || payout.status === PayoutStatus.UNDER_REVIEW) && (
                            <>
                              <Button
                                size="sm"
                                className="rounded-full"
                                onClick={() => approveMutation.mutate(payout.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Dialog open={rejectingPayoutId === payout.id} onOpenChange={(v) => !v && setRejectingPayoutId(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="rounded-full"
                                    onClick={() => setRejectingPayoutId(payout.id)}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Payout</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Reason</Label>
                                      <Input
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter rejection reason"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        onClick={() => rejectMutation.mutate({ id: payout.id, reason: rejectionReason })}
                                        disabled={!rejectionReason || rejectMutation.isPending}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          {payout.status === PayoutStatus.APPROVED && (
                            <Dialog open={payingPayoutId === payout.id} onOpenChange={(v) => !v && resetPayForm()}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="rounded-full" onClick={() => setPayingPayoutId(payout.id)}>
                                  <DollarSign className="mr-1 h-4 w-4" />
                                  Mark Paid
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mark Payout as Paid</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Transaction Reference (Optional)</Label>
                                    <Input
                                      value={transactionHash}
                                      onChange={(e) => setTransactionHash(e.target.value)}
                                      placeholder="Tx hash, receipt ID, etc."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Payment Proof (Required)</Label>
                                    <div className="border-2 border-dashed rounded-xl p-4 text-center">
                                      {proofPreview ? (
                                        <div className="space-y-2">
                                          <img src={proofPreview} alt="Proof preview" className="mx-auto max-h-40 object-contain rounded-lg" />
                                          <Button type="button" variant="ghost" size="sm" onClick={() => { setProofFile(null); setProofPreview(null); }}>
                                            Remove
                                          </Button>
                                        </div>
                                      ) : (
                                        <label className="cursor-pointer flex flex-col items-center gap-2 py-2">
                                          <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">Upload screenshot or receipt photo</span>
                                          <Input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => {
                                        if (!proofFile) {
                                          toast.error("Payment proof is required");
                                          return;
                                        }
                                        markPaidMutation.mutate({ id: payout.id, hash: transactionHash, file: proofFile });
                                      }}
                                      disabled={!proofFile || markPaidMutation.isPending}
                                    >
                                      {markPaidMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Confirm Paid
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailPayout} onOpenChange={(v) => !v && setDetailPayout(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
          </DialogHeader>
          {detailPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{detailPayout.user?.username}</p>
                  <p className="text-xs text-muted-foreground">{detailPayout.user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(detailPayout.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">${detailPayout.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p>{detailPayout.paymentMethod?.name || detailPayout.walletNetwork || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">UID / Account ID</p>
                  <p className="font-mono text-sm break-all">{detailPayout.uid || detailPayout.walletAddress || "-"}</p>
                </div>
              </div>
              {detailPayout.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Additional Information</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{detailPayout.remarks}</p>
                </div>
              )}
              {detailPayout.qrCodeImage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">User Receiving QR</p>
                  <img src={resolveMediaUrl(detailPayout.qrCodeImage)} alt="Receiving QR" className="h-48 w-48 object-contain rounded-lg border mx-auto" />
                </div>
              )}
              {detailPayout.paymentProofImage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                  <img src={resolveMediaUrl(detailPayout.paymentProofImage)} alt="Payment proof" className="max-h-56 object-contain rounded-lg border mx-auto" />
                  {detailPayout.transactionHash && detailPayout.transactionHash !== "N/A" && (
                    <p className="text-xs font-mono mt-2 break-all text-center">Ref: {detailPayout.transactionHash}</p>
                  )}
                </div>
              )}
              {detailPayout.rejectionReason && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  Rejection reason: {detailPayout.rejectionReason}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(detailPayout.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
