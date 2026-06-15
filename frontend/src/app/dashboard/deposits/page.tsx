"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign } from "lucide-react";
import { getMyDepositsAction, getMyTotalDepositAction } from "@/actions/merchant.actions";
import { DepositStatus, DepositType } from "@/lib/prisma-types";

export default function MerchantDepositsPage() {
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ["my-deposits"],
    queryFn: async () => {
      const result = await getMyDepositsAction();
      return result.success ? result.deposits : [];
    },
  });

  const { data: totalData } = useQuery({
    queryKey: ["my-total-deposit"],
    queryFn: async () => {
      const result = await getMyTotalDepositAction();
      return result.success ? result.total : 0;
    },
  });

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

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Deposits</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">View your deposit history</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Available Deposit</p>
              <p className="text-3xl font-bold">
                ${totalData?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {depositsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading deposits...</p>
            </div>
          ) : !deposits?.length ? (
            <p className="text-center text-sm text-muted-foreground py-10">No deposits yet.</p>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((deposit: any) => (
                      <TableRow key={deposit.id}>
                        <TableCell>{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>${deposit.amount.toLocaleString()}</TableCell>
                        <TableCell>{getTypeBadge(deposit.type)}</TableCell>
                        <TableCell>${deposit.requiredDeposit?.toLocaleString() || 0}</TableCell>
                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="sm:hidden space-y-3">
                {deposits.map((deposit: any) => (
                  <div key={deposit.id} className="rounded-xl border p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">${deposit.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(deposit.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getTypeBadge(deposit.type)}
                      <span className="text-xs text-muted-foreground">
                        Required: ${deposit.requiredDeposit?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
