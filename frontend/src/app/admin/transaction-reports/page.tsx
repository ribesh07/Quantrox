"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { getAllTransactionReportsAction, approveTransactionReportAction, rejectTransactionReportAction } from "@/actions/admin.actions";
import { ReportStatus } from "@/lib/prisma-types";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminTransactionReportsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-transaction-reports"],
    queryFn: async () => {
      const result = await getAllTransactionReportsAction();
      if (!result.success) throw new Error(result.error);
      return result.reports || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await approveTransactionReportAction(id);
      if (!result.success) throw new Error(result.error);
      return result.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transaction-reports"] });
      toast.success("Report approved");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await rejectTransactionReportAction(id);
      if (!result.success) throw new Error(result.error);
      return result.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transaction-reports"] });
      toast.success("Report rejected");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredReports = Array.isArray(data) ? data.filter((r: any) => 
    r.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.APPROVED:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Approved</Badge>;
      case ReportStatus.REJECTED:
        return <Badge variant="destructive" className="rounded-full px-3">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
          <p className="text-muted-foreground mt-1">Review and approve merchant transaction reports</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Reports</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
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
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Merchant</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Transactions</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Proof</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report: any) => (
                    <TableRow key={report.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{report.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.transactionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{report.totalTransactions}</TableCell>
                      <TableCell>${report.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {report.proofImage ? (
                          <img
                            src={resolveMediaUrl(report.proofImage)}
                            alt="Proof"
                            className="h-20 w-20 object-contain rounded"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        {report.status === ReportStatus.PENDING_REVIEW && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm" className="rounded-full"
                              onClick={() => approveMutation.mutate(report.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm" variant="destructive" className="rounded-full"
                              onClick={() => rejectMutation.mutate(report.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
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
