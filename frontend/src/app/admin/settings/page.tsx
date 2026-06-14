'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, TrendingUp, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getSystemSettingsAction, updateSystemSettingsAction } from '@/actions/admin.actions';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await getSystemSettingsAction();
      if (!res.success) throw new Error(res.error);
      return res.settings;
    },
  });

  const [formData, setFormData] = useState<any>({});

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await updateSystemSettingsAction(data);
      if (!res.success) throw new Error(res.error);
      return res.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (!data) return <div>Settings not found</div>;

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 pb-10 bg-[#0B0E11] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Settings</h1>
          <p className="text-[#848E9C] mt-1 font-medium">Configure platform-wide settings and limits.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Exchange Settings
              </CardTitle>
              <CardDescription className="text-[#848E9C]">Limits and processing time for exchange transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Minimum Exchange Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                    <Input
                      type="number"
                      placeholder="10"
                      value={formData.minExchangeAmount ?? data.minExchangeAmount}
                      onChange={(e) => handleChange('minExchangeAmount', parseFloat(e.target.value))}
                      className="pl-14 h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Maximum Exchange Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.maxExchangeAmount ?? data.maxExchangeAmount}
                      onChange={(e) => handleChange('maxExchangeAmount', parseFloat(e.target.value))}
                      className="pl-14 h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Processing Time</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                  <Input
                    type="number"
                    placeholder="300"
                    value={formData.exchangeProcessTime ?? data.exchangeProcessTime}
                    onChange={(e) => handleChange('exchangeProcessTime', parseInt(e.target.value))}
                    className="pl-14 h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary font-bold"
                  />
                </div>
                <p className="text-xs text-[#848E9C] ml-1">In seconds (5–30 minutes)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#2B3139] bg-[#1E2329]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Game Purchase Settings
              </CardTitle>
              <CardDescription className="text-[#848E9C]">Limits for game credit purchases.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Minimum Purchase Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                    <Input
                      type="number"
                      placeholder="5"
                      value={formData.minGamePurchaseAmount ?? data.minGamePurchaseAmount}
                      onChange={(e) => handleChange('minGamePurchaseAmount', parseFloat(e.target.value))}
                      className="pl-14 h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Maximum Purchase Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                    <Input
                      type="number"
                      placeholder="10000"
                      value={formData.maxGamePurchaseAmount ?? data.maxGamePurchaseAmount}
                      onChange={(e) => handleChange('maxGamePurchaseAmount', parseFloat(e.target.value))}
                      className="pl-14 h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#2B3139] bg-[#1E2329]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Maintenance
              </CardTitle>
              <CardDescription className="text-[#848E9C]">Toggle maintenance mode and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white font-bold">Maintenance Mode</Label>
                  <p className="text-xs text-[#848E9C]">Put the platform in maintenance mode for all users</p>
                </div>
                <Switch
                  checked={formData.maintenanceMode ?? data.maintenanceMode}
                  onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
                />
              </div>

              {(formData.maintenanceMode ?? data.maintenanceMode) && (
                <div className="space-y-2">
                  <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Maintenance Message</Label>
                  <Input
                    placeholder="We're upgrading our systems. We'll be back shortly!"
                    value={formData.maintenanceMessage ?? data.maintenanceMessage ?? ''}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-2xl focus:border-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white font-bold">Two-Factor Authentication Required</Label>
                  <p className="text-xs text-[#848E9C]">Force all users to enable 2FA</p>
                </div>
                <Switch
                  checked={formData.twoFactorRequired ?? data.twoFactorRequired}
                  onCheckedChange={(checked) => handleChange('twoFactorRequired', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
