"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getMyPayoutRequestsAction, createPayoutRequestAction } from "@/actions/merchant.actions";
import { PayoutStatus } from "@/lib/prisma-types";

export default function MerchantPayoutsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
      formData.append("walletAddress", walletAddress);
      formData.append("walletNetwork", walletNetwork);
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
      setOpen(false);
      setAmount("");
      setWalletAddress("");
      setWalletNetwork("");
      setRemarks("");
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground mt-1">Request and track your payouts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Wallet Network</Label>
                <Input
                  value={walletNetwork}
                  onChange={(e) => setWalletNetwork(e.target.value)}
                  placeholder="USDT (TRC20)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>QR Code (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
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
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payouts...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((payout: any) => (
                  <TableRow key={payout.id}>
                    <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>${payout.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{payout.walletAddress}</TableCell>
                    <TableCell>{payout.walletNetwork}</TableCell>
                    <TableCell>
                      {payout.qrCodeImage ? (
                        <img src={payout.qrCodeImage} alt="QR" className="h-10 w-10 object-contain" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payout.transactionHash || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
