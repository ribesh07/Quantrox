"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Snowflake, Search, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { getAllDepositsAction, approveDepositAction, rejectDepositAction, freezeDepositAction, releaseDepositAction, adjustDepositAction } from "@/actions/admin.actions";
import { DepositStatus, DepositType } from "@/lib/prisma-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminDepositsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adjustDepositId, setAdjustDepositId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const result = await getAllDepositsAction();
      if (!result.success) throw new Error(result.error);
      return result.deposits || [];
    },
  });

  const createMutation = (action: any) => useMutation({
    mutationFn: async (id: string) => {
      const result = await action(id);
      if (!result.success) throw new Error(result.error);
      return result.deposit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      toast.success("Deposit updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const approve = createMutation(approveDepositAction);
  const reject = createMutation(rejectDepositAction);
  const freeze = createMutation(freezeDepositAction);
  const release = createMutation(releaseDepositAction);

  const adjust = useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      const result = await adjustDepositAction(id, amount, notes);
      if (!result.success) throw new Error(result.error);
      return result.deposit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      toast.success("Deposit adjusted");
      setAdjustDepositId(null);
      setAdjustAmount("");
      setAdjustNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredDeposits = Array.isArray(data) ? data.filter((d: any) => 
    d.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getStatusBadge = (status: DepositStatus) => {
    switch (status) {
      case DepositStatus.APPROVED:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Approved</Badge>;
      case DepositStatus.FROZEN:
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full px-3">Frozen</Badge>;
      case DepositStatus.RELEASED:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Released</Badge>;
      case DepositStatus.REJECTED:
        return <Badge variant="destructive" className="rounded-full px-3">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: DepositType) => {
    switch (type) {
      case DepositType.INITIAL:
        return <Badge variant="outline" className="rounded-full px-3">Initial</Badge>;
      case DepositType.ADDITIONAL:
        return <Badge variant="outline" className="rounded-full px-3">Additional</Badge>;
      case DepositType.ADJUSTMENT:
        return <Badge variant="outline" className="rounded-full px-3">Adjustment</Badge>;
      case DepositType.WITHDRAWAL:
        return <Badge variant="outline" className="rounded-full px-3">Withdrawal</Badge>;
      default:
        return null;
    }
  };

  const handleAdjust = () => {
    if (!adjustDepositId || !adjustAmount) return;
    adjust.mutate({ id: adjustDepositId, amount: parseFloat(adjustAmount), notes: adjustNotes });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Management</h1>
          <p className="text-muted-foreground mt-1">Manage merchant deposits</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Deposits</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deposits..."
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
              <p className="text-sm text-muted-foreground">Loading deposits...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Merchant</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Required</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeposits.map((deposit: any) => (
                    <TableRow key={deposit.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{deposit.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{deposit.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>${deposit.amount?.toLocaleString() || "0"}</TableCell>
                      <TableCell>{getTypeBadge(deposit.type)}</TableCell>
                      <TableCell>${deposit.requiredDeposit?.toLocaleString() || "0"}</TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {deposit.status === DepositStatus.PENDING && (
                            <>
                              <Button
                                size="sm" className="rounded-full"
                                onClick={() => approve.mutate(deposit.id)}
                                disabled={approve.isPending}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm" variant="destructive" className="rounded-full"
                                onClick={() => reject.mutate(deposit.id)}
                                disabled={reject.isPending}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(deposit.status === DepositStatus.APPROVED || deposit.status === DepositStatus.RELEASED) && (
                            <Button
                              size="sm" variant="outline" className="rounded-full"
                              onClick={() => freeze.mutate(deposit.id)}
                              disabled={freeze.isPending}
                            >
                              <Snowflake className="mr-2 h-4 w-4" />
                              Freeze
                            </Button>
                          )}
                          {deposit.status === DepositStatus.FROZEN && (
                            <Button
                              size="sm" className="rounded-full"
                              onClick={() => release.mutate(deposit.id)}
                              disabled={release.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Release
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm" variant="outline" className="rounded-full"
                                onClick={() => {
                                  setAdjustDepositId(deposit.id);
                                  setAdjustAmount(deposit.amount?.toString() || "");
                                }}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Deposit</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>New Amount</Label>
                                  <Input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Notes (Optional)</Label>
                                  <Input
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={handleAdjust}
                                    disabled={!adjustAmount || adjust.isPending}
                                  >
                                    Adjust
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
