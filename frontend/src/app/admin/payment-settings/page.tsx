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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  getAllPaymentMethodsAction,
  updatePaymentMethodAction,
  uploadPaymentMethodQRAction,
  createPaymentMethodAction,
  deletePaymentMethodAction,
} from "@/actions/admin.actions";
import { cn } from "@/lib/utils";

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [newMethod, setNewMethod] = useState({
    name: "",
    category: "BOTH" as "DEPOSIT" | "EXCHANGE" | "BOTH",
    rate: 1,
    feePercentage: 0,
    minAmount: 0,
    maxAmount: 1000000,
    details: "",
  });
  const [newQrFile, setNewQrFile] = useState<File | null>(null);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const result = await getAllPaymentMethodsAction();
      if (!result.success) throw new Error(result.error);
      return result.methods || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createPaymentMethodAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Payment method created successfully");
      setNewMethod({
        name: "",
        category: "BOTH",
        rate: 1,
        feePercentage: 0,
        minAmount: 0,
        maxAmount: 1000000,
        details: "",
      });
      setNewQrFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
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
    },
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePaymentMethodAction(id);
      if (!result.success) throw new Error(result.error);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Payment method deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newMethod.name);
    formData.append("category", newMethod.category);
    formData.append("rate", newMethod.rate.toString());
    formData.append("feePercentage", newMethod.feePercentage.toString());
    formData.append("minAmount", newMethod.minAmount.toString());
    formData.append("maxAmount", newMethod.maxAmount.toString());
    formData.append("details", newMethod.details);
    if (newQrFile) {
      formData.append("qrCode", newQrFile);
    }
    createMutation.mutate(formData);
  };

  if (isLoading)
    return (
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
          <p className="text-muted-foreground">
            Manage fees, rates, and active status for all payment methods
          </p>
        </div>
      </div>

      {/* Add New Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Method Name</Label>
              <Input
                placeholder="e.g., Bank Transfer"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newMethod.category}
                onValueChange={(val: any) => setNewMethod({ ...newMethod, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="EXCHANGE">Exchange</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rate</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1.00"
                value={newMethod.rate}
                onChange={(e) =>
                  setNewMethod({ ...newMethod, rate: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={newMethod.feePercentage}
                onChange={(e) =>
                  setNewMethod({
                    ...newMethod,
                    feePercentage: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Min Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={newMethod.minAmount}
                onChange={(e) =>
                  setNewMethod({
                    ...newMethod,
                    minAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max Amount</Label>
              <Input
                type="number"
                placeholder="1000000"
                value={newMethod.maxAmount}
                onChange={(e) =>
                  setNewMethod({
                    ...newMethod,
                    maxAmount: parseFloat(e.target.value) || 1000000,
                  })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Payment Details</Label>
              <Input
                placeholder="Payment instructions, account number, etc."
                value={newMethod.details}
                onChange={(e) => setNewMethod({ ...newMethod, details: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>QR Code (Optional)</Label>
              <input
                type="file"
                accept="image/*"
                id="new-qr"
                className="hidden"
                onChange={(e) => setNewQrFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="secondary"
                type="button"
                onClick={() => document.getElementById("new-qr")?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {newQrFile ? "Change QR Code" : "Upload QR Code"}
              </Button>
              {newQrFile && (
                <p className="text-sm text-green-600">Selected: {newQrFile.name}</p>
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full md:w-auto"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Payment Method
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* All Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>All Methods</CardTitle>
          <CardDescription>Configure exchange and top-up settings</CardDescription>
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
                <TableHead>Details</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(methods) &&
                methods.map((method: any) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                      <Input
                        defaultValue={method.name}
                        onBlur={(e) =>
                          updateMutation.mutate({ id: method.id, name: e.target.value })
                        }
                        className="w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={method.category}
                        onValueChange={(val: any) =>
                          updateMutation.mutate({ id: method.id, category: val })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEPOSIT">Deposit</SelectItem>
                          <SelectItem value="EXCHANGE">Exchange</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          className="w-24 h-8"
                          type="number"
                          step="0.01"
                          defaultValue={method.rate}
                          onBlur={(e) =>
                            updateMutation.mutate({ id: method.id, rate: parseFloat(e.target.value) })
                          }
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
                          onBlur={(e) =>
                            updateMutation.mutate({
                              id: method.id,
                              feePercentage: parseFloat(e.target.value),
                            })
                          }
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
                            onBlur={(e) =>
                              updateMutation.mutate({
                                id: method.id,
                                minAmount: parseFloat(e.target.value),
                              })
                            }
                          />
                        </span>
                        <span className="flex items-center gap-1">
                          Max:
                          <Input
                            className="w-16 h-6 p-1"
                            type="number"
                            defaultValue={method.maxAmount}
                            onBlur={(e) =>
                              updateMutation.mutate({
                                id: method.id,
                                maxAmount: parseFloat(e.target.value),
                              })
                            }
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={method.details || ""}
                        placeholder="Payment details"
                        onBlur={(e) =>
                          updateMutation.mutate({ id: method.id, details: e.target.value })
                        }
                        className="w-48"
                      />
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
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: method.id, active: checked })
                        }
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
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(method.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
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
