"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { getAllOrdersAction, reviewOrderAction } from "@/actions/admin.actions";

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const result = await getAllOrdersAction();
      if (!result.success) throw new Error(result.error);
      return result.orders || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: any) => {
      const result = await reviewOrderAction(id, status, adminNote);
      if (!result.success) throw new Error(result.error);
      return result.order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case "PENDING_PAYMENT":
        return <Badge className="bg-blue-400">Awaiting Payment</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-600">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Review and manage exchange and top-up requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(orders) && orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(-6)}</TableCell>
                  <TableCell>{order.user.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.type}</Badge>
                  </TableCell>
                  <TableCell>{order.paymentMethod?.name || "N/A"}</TableCell>
                  <TableCell>${order.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-green-600">
                    {order.type === 'EXCHANGE' ? `${order.receivedAmount.toFixed(2)} USDT` : `${order.receivedAmount.toFixed(2)} Points`}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Transaction Details - #{selectedOrder?.id.slice(-6)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedOrder.user.username} ({selectedOrder.user.email})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedOrder.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium">{selectedOrder.paymentMethod?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Input Amount</p>
                  <p className="font-medium">${selectedOrder.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee / Rate</p>
                  <p className="font-medium">
                    ${selectedOrder.fee.toFixed(2)} / {selectedOrder.rate}
                  </p>
                </div>
                <div className="col-span-2 p-3 bg-muted rounded-lg border">
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Final Amount to Deliver</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedOrder.receivedAmount.toFixed(2)} {selectedOrder.type === 'EXCHANGE' ? 'USDT' : 'Game Points'}
                  </p>
                  {selectedOrder.walletAddress && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-muted-foreground text-xs">Destination Address</p>
                      <p className="font-mono text-sm break-all">{selectedOrder.walletAddress}</p>
                    </div>
                  )}
                </div>
                {selectedOrder.game && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Game</p>
                      <p className="font-medium">{selectedOrder.game.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Game ID</p>
                      <p className="font-medium">{selectedOrder.gameUsername}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedOrder.proofImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  Payment Proof
                  <a href={selectedOrder.proofImage} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" /> View Full
                  </a>
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
                  <Image
                    src={selectedOrder.proofImage}
                    alt="Payment Proof"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {selectedOrder.receiveQrCode && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  Receiving QR Code
                  <a href={selectedOrder.receiveQrCode} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" /> View Full
                  </a>
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
                  <Image
                    src={selectedOrder.receiveQrCode}
                    alt="Receiving QR"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

              {selectedOrder.type === "EXCHANGE" && (
                <div className="p-4 bg-muted rounded-lg border space-y-2">
                  <p className="text-sm font-medium">Receiving Wallet Details</p>
                  {selectedOrder.receiveUsername && <p className="text-sm">Username: {selectedOrder.receiveUsername}</p>}
                  {selectedOrder.receiveWalletNumber && <p className="text-sm">Wallet Number: {selectedOrder.receiveWalletNumber}</p>}
                  {selectedOrder.receiveEmail && <p className="text-sm">Email: {selectedOrder.receiveEmail}</p>}
                  {selectedOrder.receivePhone && <p className="text-sm">Phone: {selectedOrder.receivePhone}</p>}
                </div>
              )}

              <div className="flex gap-4">
                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'REJECTED' && (
                  <>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: selectedOrder.id, status: "APPROVED" })}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: selectedOrder.id, status: "COMPLETED" })}
                    >
                      <Check className="mr-2 h-4 w-4" /> Mark Completed
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={reviewMutation.isPending}
                      onClick={() => {
                        const note = prompt("Enter rejection reason:");
                        if (note) {
                          reviewMutation.mutate({ id: selectedOrder.id, status: "REJECTED", adminNote: note });
                        }
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
              {selectedOrder.adminNote && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                  <strong>Admin Note:</strong> {selectedOrder.adminNote}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
