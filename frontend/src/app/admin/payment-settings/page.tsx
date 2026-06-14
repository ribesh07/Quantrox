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
import { UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { getAllPaymentMethodsAction, updatePaymentMethodAction, uploadPaymentMethodQRAction } from "@/actions/admin.actions";
import { cn } from "@/lib/utils";

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const result = await getAllPaymentMethodsAction();
      if (!result.success) throw new Error(result.error);
      return result.methods || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const result = await updatePaymentMethodAction(id, data);
      if (!result.success) throw new Error(result.error);
      return result.method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Payment method updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const uploadQRMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("qrCode", file);
      const result = await uploadPaymentMethodQRAction(id, formData);
      if (!result.success) throw new Error(result.error);
      return result.method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("QR code uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading payment methods...</p>
    </div>
  );

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
                <TableHead>QR Code</TableHead>
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
                        onBlur={(e) => updateMutation.mutate({ id: method.id, rate: parseFloat(e.target.value) })}
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
                        onBlur={(e) => updateMutation.mutate({ id: method.id, feePercentage: parseFloat(e.target.value) })}
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
                          onBlur={(e) => updateMutation.mutate({ id: method.id, minAmount: parseFloat(e.target.value) })}
                        />
                      </span>
                      <span className="flex items-center gap-1">
                        Max: 
                        <Input
                          className="w-16 h-6 p-1"
                          type="number"
                          defaultValue={method.maxAmount}
                          onBlur={(e) => updateMutation.mutate({ id: method.id, maxAmount: parseFloat(e.target.value) })}
                        />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {method.qrCode ? (
                      <div className="relative group">
                        <Image
                          src={method.qrCode}
                          alt="QR"
                          width={60}
                          height={60}
                          className="rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="w-15 h-15 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={method.active}
                      onCheckedChange={(checked) => updateMutation.mutate({ id: method.id, active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        id={`qr-${method.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadQRMutation.mutate({ id: method.id, file });
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById(`qr-${method.id}`)?.click()}
                        disabled={uploadQRMutation.isPending}
                      >
                        {uploadQRMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        Upload QR
                      </Button>
                    </div>
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
