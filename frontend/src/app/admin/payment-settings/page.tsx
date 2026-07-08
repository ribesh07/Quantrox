"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, Wallet2 } from "lucide-react";
import { toast } from "sonner";
import { createPaymentMethodAction, deletePaymentMethodAction, getAllPaymentMethodsAction, updatePaymentMethodAction } from "@/actions/admin.actions";

type PaymentMethodForm = {
  id?: string;
  name: string;
  category: "DEPOSIT" | "EXCHANGE" | "BOTH";
  details: string;
  feePercentage: string;
  rate: string;
  minAmount: string;
  maxAmount: string;
  active: boolean;
};

const emptyForm = (): PaymentMethodForm => ({
  name: "",
  category: "BOTH",
  details: "",
  feePercentage: "0",
  rate: "1",
  minAmount: "0",
  maxAmount: "1000000",
  active: true,
});

export default function AdminPaymentSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PaymentMethodForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadMethods();
    }
  }, [status, router]);

  const loadMethods = async () => {
    setLoading(true);
    const result = await getAllPaymentMethodsAction();
    if (result.success) {
      setMethods(result.methods || []);
    } else {
      toast.error(result.error || "Failed to load payment methods");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        category: form.category,
        details: form.details,
        feePercentage: form.feePercentage,
        rate: form.rate,
        minAmount: form.minAmount,
        maxAmount: form.maxAmount,
        active: form.active,
      };

      let result;
      if (editingId) {
        result = await updatePaymentMethodAction(editingId, payload);
      } else {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)));
        result = await createPaymentMethodAction(formData);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to save payment method");
      }

      toast.success(editingId ? "Payment method updated" : "Payment method created");
      setForm(emptyForm());
      setEditingId(null);
      await loadMethods();
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (method: any) => {
    setEditingId(method.id);
    setForm({
      id: method.id,
      name: method.name,
      category: method.category,
      details: method.details || "",
      feePercentage: method.feePercentage?.toString() || "0",
      rate: method.rate?.toString() || "1",
      minAmount: method.minAmount?.toString() || "0",
      maxAmount: method.maxAmount?.toString() || "1000000",
      active: method.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this payment method?")) return;

    const result = await deletePaymentMethodAction(id);
    if (result.success) {
      toast.success("Payment method deleted");
      await loadMethods();
    } else {
      toast.error(result.error || "Failed to delete payment method");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment Options</h1>
          <p className="text-sm text-muted-foreground">Manage payment methods available to merchants and users.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => { setForm(emptyForm()); setEditingId(null); }}>
          <Plus className="mr-2 h-4 w-4" /> New Option
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Payment Option" : "Create Payment Option"}</CardTitle>
            <CardDescription>Choose the method name, category, fees, and availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bank Transfer" required />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                >
                  <option value="DEPOSIT">Deposit</option>
                  <option value="EXCHANGE">Exchange</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Details</Label>
                <Input value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Instructions for user" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fee Percentage (%)</Label>
                  <Input type="number" step="0.01" value={form.feePercentage} onChange={(e) => setForm({ ...form, feePercentage: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Min Amount</Label>
                  <Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Amount</Label>
                  <Input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: !!checked })} />
                <Label>Active</Label>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update Option" : "Create Option"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configured Options</CardTitle>
            <CardDescription>Enable, disable, edit, and remove payment methods.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : methods.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No payment options yet.
              </div>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <div key={method.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Wallet2 className="h-4 w-4 text-primary" />
                          <span className="font-medium">{method.name}</span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span className="mr-2">{method.category}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${method.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                            {method.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{method.details || "No instructions provided"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="icon" variant="outline" onClick={() => handleEdit(method)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="outline" onClick={() => handleDelete(method.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
