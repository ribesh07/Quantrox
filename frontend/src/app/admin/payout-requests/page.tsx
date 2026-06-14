"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search, DollarSign, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { getAllPayoutRequestsAction, approvePayoutRequestAction, rejectPayoutRequestAction, markPayoutPaidAction } from "@/actions/admin.actions";
import { PayoutStatus } from "@/lib/prisma-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminPayoutRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [payingPayoutId, setPayingPayoutId] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [rejectingPayoutId, setRejectingPayoutId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => {
      const result = await getAllPayoutRequestsAction();
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
      toast.success("Payout approved");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const result = await rejectPayoutRequestAction(id, reason);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      toast.success("Payout rejected");
      setRejectingPayoutId(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, hash }: { id: string; hash: string }) => {
      const result = await markPayoutPaidAction(id, hash);
      if (!result.success) throw new Error(result.error);
      return result.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      toast.success("Payout marked as paid");
      setPayingPayoutId(null);
      setTransactionHash("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredPayouts = Array.isArray(data) ? data.filter((p: any) => 
    p.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

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

  const handleReject = () => {
    if (!rejectingPayoutId || !rejectionReason) return;
    rejectMutation.mutate({ id: rejectingPayoutId, reason: rejectionReason });
  };

  const handleMarkPaid = () => {
    if (!payingPayoutId || !transactionHash) return;
    markPaidMutation.mutate({ id: payingPayoutId, hash: transactionHash });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-muted-foreground mt-1">Review and process merchant payouts</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Payouts</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payouts..."
                className="pl-10 h-10 rounded-xl border-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payouts...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Merchant</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Wallet</TableHead>
                    <TableHead className="font-bold">Network</TableHead>
                    <TableHead className="font-bold">QR</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ${payout.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payout.walletAddress}
                      </TableCell>
                      <TableCell>{payout.walletNetwork}</TableCell>
                      <TableCell>
                        {payout.qrCodeImage ? (
                          <img
                            src={payout.qrCodeImage}
                            alt="QR Code"
                            className="h-12 w-12 object-contain"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(payout.status === PayoutStatus.PENDING || payout.status === PayoutStatus.UNDER_REVIEW) && (
                            <>
                              <Button
                                size="sm" className="rounded-full"
                                onClick={() => approveMutation.mutate(payout.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm" variant="destructive" className="rounded-full"
                                    onClick={() => setRejectingPayoutId(payout.id)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
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
                                        onClick={handleReject}
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
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm" className="rounded-full"
                                  onClick={() => setPayingPayoutId(payout.id)}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Mark Paid
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mark Payout as Paid</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Transaction Hash/Reference</Label>
                                    <Input
                                      value={transactionHash}
                                      onChange={(e) => setTransactionHash(e.target.value)}
                                      placeholder="Enter transaction hash"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={handleMarkPaid}
                                      disabled={!transactionHash || markPaidMutation.isPending}
                                    >
                                      Mark Paid
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
    </div>
  );
}
