"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Shield, Ban, Trash2, Search, Loader2, MoreVertical, ShieldCheck, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllUsersAction, updateUserRoleAction, deleteUserAction } from "@/actions/admin.actions";
import { Role } from "@prisma/client";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await getAllUsersAction();
      if (!result.success) throw new Error(result.error);
      return result.users || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteUserAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: Role }) => {
      const result = await updateUserRoleAction(id, role);
      if (!result.success) throw new Error(result.error);
      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const filteredUsers = Array.isArray(users) ? users.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 rounded-full px-3">Super Admin</Badge>;
      case "STAFF_ADMIN":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 rounded-full px-3">Staff Admin</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">User</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, roles, and permissions.</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Users</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by username or email..." 
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
              <p className="text-sm text-muted-foreground">Fetching users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold">Joined Date</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl">
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="rounded-lg px-3 py-2 cursor-pointer"
                              onClick={() => updateRoleMutation.mutate({ id: user.id, role: user.role === Role.USER ? Role.STAFF_ADMIN : Role.USER })}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                              <span>{user.role === 'USER' ? 'Make Staff Admin' : 'Revoke Admin'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50">
                              <Ban className="mr-2 h-4 w-4" />
                              <span>Suspend User</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="rounded-lg px-3 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this user?")) {
                                  deleteMutation.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete User</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
