import { prisma } from "../shared/prisma";
import { Role, Permission } from "@prisma/client";

export const RolePermissionService = {
  async getPermissionsByRole(role: Role) {
    return await prisma.rolePermission.findMany({
      where: { role },
    });
  },

  async setRolePermissions(role: Role, permissions: Permission[]) {
    // First delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { role },
    });
    // Then add new ones
    const rolePermissions = await Promise.all(
      permissions.map(permission => 
        prisma.rolePermission.create({
          data: { role, permission }
        })
      )
    );
    return rolePermissions;
  },

  async addRolePermission(role: Role, permission: Permission) {
    return await prisma.rolePermission.upsert({
      where: { role_permission: { role, permission } },
      update: {},
      create: { role, permission },
    });
  },

  async removeRolePermission(role: Role, permission: Permission) {
    return await prisma.rolePermission.deleteMany({
      where: { role, permission },
    });
  },

  async getAllRolePermissions() {
    return await prisma.rolePermission.findMany({
      orderBy: { role: 'asc' },
    });
  },

  // Helper to check if a role has a permission
  async hasPermission(role: Role, permission: Permission) {
    const rolePermission = await prisma.rolePermission.findUnique({
      where: { role_permission: { role, permission } }
    });
    return !!rolePermission;
  },
};
