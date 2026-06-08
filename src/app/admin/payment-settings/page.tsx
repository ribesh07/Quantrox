"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payment-methods");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Payment method updated successfully");
    },
  });

  const handleUpdate = (id: string, data: any) => {
    updateMutation.mutate({ id, ...data });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods & Rates</h1>
          <p className="text-muted-foreground">Manage fees, rates, and active status for all payment methods</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Methods</CardTitle>
          <CardDescription>Configure deposit and exchange settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Fee (%)</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(methods) && methods.map((method: any) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{method.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-24 h-8"
                        type="number"
                        step="0.01"
                        defaultValue={method.rate}
                        onBlur={(e) => handleUpdate(method.id, { rate: e.target.value })}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20 h-8"
                        type="number"
                        step="0.1"
                        defaultValue={method.feePercentage}
                        onBlur={(e) => handleUpdate(method.id, { feePercentage: e.target.value })}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1">
                        Min: 
                        <Input
                          className="w-16 h-6 p-1"
                          type="number"
                          defaultValue={method.minAmount}
                          onBlur={(e) => handleUpdate(method.id, { minAmount: e.target.value })}
                        />
                      </span>
                      <span className="flex items-center gap-1">
                        Max: 
                        <Input
                          className="w-16 h-6 p-1"
                          type="number"
                          defaultValue={method.maxAmount}
                          onBlur={(e) => handleUpdate(method.id, { maxAmount: e.target.value })}
                        />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={method.active}
                      onCheckedChange={(checked) => handleUpdate(method.id, { active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => {
                      // Logic for details/QR code could go here in a dialog
                      toast.info("Detailed editing coming soon");
                    }}>
                      Edit Info
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
