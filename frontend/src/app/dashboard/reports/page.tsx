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
import { getMyTransactionReportsAction, createTransactionReportAction } from "@/actions/merchant.actions";
import { ReportStatus } from "@/lib/prisma-types";

export default function MerchantReportsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalTransactions, setTotalTransactions] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const result = await getMyTransactionReportsAction();
      return result.success ? result.reports : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("transactionDate", transactionDate);
      formData.append("totalTransactions", totalTransactions);
      formData.append("totalAmount", totalAmount);
      formData.append("notes", notes);
      if (file) {
        formData.append("proofImage", file);
      }
      const result = await createTransactionReportAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      toast.success("Report submitted!");
      setOpen(false);
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setTotalTransactions("");
      setTotalAmount("");
      setNotes("");
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

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
          <p className="text-muted-foreground mt-1">Submit your daily transaction reports</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Submit Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Transaction Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction Date</Label>
                <Input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Transactions</Label>
                <Input
                  type="number"
                  value={totalTransactions}
                  onChange={(e) => setTotalTransactions(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Amount (USD)</Label>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="10000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Proof/Screenshot (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell>{new Date(report.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell>{report.totalTransactions}</TableCell>
                    <TableCell>${report.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      {report.proofImage ? (
                        <img src={report.proofImage} alt="Proof" className="h-12 w-12 object-contain rounded" />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedReport(report); setReportViewOpen(true); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={reportViewOpen} onOpenChange={setReportViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport ? (
            <div className="space-y-4">
              <div><strong>Date:</strong> {new Date(selectedReport.transactionDate).toLocaleDateString()}</div>
              <div><strong>Total Transactions:</strong> {selectedReport.totalTransactions}</div>
              <div><strong>Total Amount:</strong> ${selectedReport.totalAmount.toLocaleString()}</div>
              <div><strong>Notes:</strong> {selectedReport.notes || '-'}</div>
              <div><strong>Proof:</strong></div>
              {selectedReport.proofImage ? <img src={selectedReport.proofImage} alt="Proof" className="h-40 w-40 object-contain" /> : <div>-</div>}
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setReportViewOpen(false)}>Close</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
