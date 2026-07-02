'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, TrendingUp, DollarSign, Clock, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSystemSettingsAction, updateSystemSettingsAction, getAllRolePermissionsAction, getPermissionsByRoleAction, setRolePermissionsAction } from '@/actions/admin.actions';
import { Role, Permission } from '@/lib/prisma-types';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('system');
  const [selectedRole, setSelectedRole] = useState<Role>('SUB_ADMIN');

  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await getSystemSettingsAction();
      if (!res.success) throw new Error(res.error);
      return res.settings;
    },
  });

  const { data: rolePermissionsData, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['all-role-permissions'],
    queryFn: async () => {
      const res = await getAllRolePermissionsAction();
      if (!res.success) throw new Error(res.error);
      return res.rolePermissions;
    },
  });

  const { data: selectedRolePermissions, refetch: refetchRolePermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const res = await getPermissionsByRoleAction(selectedRole);
      if (!res.success) throw new Error(res.error);
      return res.permissions;
    },
  });

  const [formData, setFormData] = useState<any>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const systemUpdateMutation = useMutation({
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

  const rolePermissionsUpdateMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: Role; permissions: string[] }) => {
      const res = await setRolePermissionsAction(role, permissions);
      if (!res.success) throw new Error(res.error);
      return res.rolePermissions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole] });
      toast.success('Role permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });

  // Update selectedPermissions when selectedRole or selectedRolePermissions changes
  React.useEffect(() => {
    if (selectedRolePermissions) {
      setSelectedPermissions(selectedRolePermissions.map(p => p.permission));
    }
  }, [selectedRole, selectedRolePermissions]);

  if (systemLoading || rolePermissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (!systemData) return <div>Settings not found</div>;

  const handleSystemChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    systemUpdateMutation.mutate(formData);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission) 
        : [...prev, permission]
    );
  };

  const handleRolePermissionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rolePermissionsUpdateMutation.mutate({ 
      role: selectedRole, 
      permissions: selectedPermissions 
    });
  };

  const permissionGroups = [
    {
      title: 'Orders',
      permissions: ['VIEW_ORDERS', 'MANAGE_ORDERS']
    },
    {
      title: 'Users',
      permissions: ['VIEW_USERS', 'MANAGE_USERS']
    },
    {
      title: 'Games',
      permissions: ['VIEW_GAMES', 'MANAGE_GAMES']
    },
    {
      title: 'Merchants',
      permissions: ['VIEW_MERCHANTS', 'MANAGE_MERCHANTS']
    },
    {
      title: 'Payments',
      permissions: ['VIEW_PAYMENT_METHODS', 'MANAGE_PAYMENT_METHODS']
    },
    {
      title: 'Deposits',
      permissions: ['VIEW_DEPOSITS', 'MANAGE_DEPOSITS']
    },
    {
      title: 'Payouts',
      permissions: ['VIEW_PAYOUTS', 'MANAGE_PAYOUTS']
    },
    {
      title: 'Settings',
      permissions: ['VIEW_SETTINGS', 'MANAGE_SETTINGS']
    },
    {
      title: 'Game ID Requests',
      permissions: ['VIEW_GAME_ID_REQUESTS', 'MANAGE_GAME_ID_REQUESTS']
    },
  ];

  return (
    <div className="space-y-8 pb-10 bg-[#0B0E11] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-[#848E9C] mt-1 font-medium">Configure platform settings and role-based permissions.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#1E2329] border border-[#2B3139] rounded-2xl p-1">
          <TabsTrigger value="system" className="data-[state=active]:bg-primary rounded-xl">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary rounded-xl">
            <Users className="h-4 w-4 mr-2" />
            Role Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <form onSubmit={handleSystemSubmit} className="space-y-6">
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
                        value={formData.minExchangeAmount ?? systemData.minExchangeAmount}
                        onChange={(e) => handleSystemChange('minExchangeAmount', parseFloat(e.target.value))}
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
                        value={formData.maxExchangeAmount ?? systemData.maxExchangeAmount}
                        onChange={(e) => handleSystemChange('maxExchangeAmount', parseFloat(e.target.value))}
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
                      value={formData.exchangeProcessTime ?? systemData.exchangeProcessTime}
                      onChange={(e) => handleSystemChange('exchangeProcessTime', parseInt(e.target.value))}
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
                        value={formData.minGamePurchaseAmount ?? systemData.minGamePurchaseAmount}
                        onChange={(e) => handleSystemChange('minGamePurchaseAmount', parseFloat(e.target.value))}
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
                        value={formData.maxGamePurchaseAmount ?? systemData.maxGamePurchaseAmount}
                        onChange={(e) => handleSystemChange('maxGamePurchaseAmount', parseFloat(e.target.value))}
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
                    checked={formData.maintenanceMode ?? systemData.maintenanceMode}
                    onCheckedChange={(checked) => handleSystemChange('maintenanceMode', checked)}
                  />
                </div>

                {(formData.maintenanceMode ?? systemData.maintenanceMode) && (
                  <div className="space-y-2">
                    <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Maintenance Message</Label>
                    <Input
                      placeholder="We're upgrading our systems. We'll be back shortly!"
                      value={formData.maintenanceMessage ?? systemData.maintenanceMessage ?? ''}
                      onChange={(e) => handleSystemChange('maintenanceMessage', e.target.value)}
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
                    checked={formData.twoFactorRequired ?? systemData.twoFactorRequired}
                    onCheckedChange={(checked) => handleSystemChange('twoFactorRequired', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={systemUpdateMutation.isPending}
                className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {systemUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Role Permissions
              </CardTitle>
              <CardDescription className="text-[#848E9C]">Configure permissions for each role in the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#848E9C] font-black uppercase tracking-wider text-xs ml-1">Select Role</Label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full h-14 bg-[#0B0E11] border border-[#2B3139] text-white rounded-2xl px-4 font-bold focus:outline-none focus:border-primary"
                >
                  <option value="USER">User</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="STAFF_ADMIN">Staff Admin</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <form onSubmit={handleRolePermissionsSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {permissionGroups.map((group) => (
                    <div key={group.title} className="bg-[#0B0E11] rounded-2xl p-4 border border-[#2B3139]">
                      <h4 className="text-white font-bold mb-4">{group.title}</h4>
                      <div className="space-y-3">
                        {group.permissions.map((permission) => (
                          <div key={permission} className="flex items-center justify-between">
                            <Label className="text-[#848E9C] font-medium">{permission}</Label>
                            <button
                              type="button"
                              onClick={() => togglePermission(permission)}
                              className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                                selectedPermissions.includes(permission)
                                  ? 'bg-primary'
                                  : 'bg-[#2B3139]'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  selectedPermissions.includes(permission)
                                    ? 'ml-5'
                                    : 'ml-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={rolePermissionsUpdateMutation.isPending}
                    className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    {rolePermissionsUpdateMutation.isPending ? 'Saving...' : 'Save Permissions'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
