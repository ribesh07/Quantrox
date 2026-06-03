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
import { Check, Eye, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: any) => {
      const res = await fetch(`/api/admin/orders/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
      toast.success("Order status updated");
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-500">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Review and manage user orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(orders) && orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>{order.user.username}</TableCell>
                  <TableCell className="capitalize">
                    {order.type.replace("_", " ")}
                  </TableCell>
                  <TableCell>${order.amount.toFixed(2)}</TableCell>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
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
                  <p className="font-medium capitalize">{selectedOrder.type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">${selectedOrder.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rate / Total</p>
                  <p className="font-medium">
                    {selectedOrder.rate} / {selectedOrder.total.toFixed(2)}
                  </p>
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

              {selectedOrder.screenshot ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Payment Proof</p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image
                      src={selectedOrder.screenshot}
                      alt="Proof"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs"
                    asChild
                  >
                    <a href={selectedOrder.screenshot} target="_blank" rel="noreferrer">
                      View Full Image
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                  No proof uploaded yet
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={reviewMutation.isPending || selectedOrder.status === "COMPLETED"}
                  onClick={() => reviewMutation.mutate({ id: selectedOrder.id, status: "COMPLETED" })}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve & Complete
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={reviewMutation.isPending || selectedOrder.status === "REJECTED"}
                  onClick={() => {
                    const note = prompt("Enter rejection reason:");
                    if (note) {
                      reviewMutation.mutate({ id: selectedOrder.id, status: "REJECTED", adminNote: note });
                    }
                  }}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
