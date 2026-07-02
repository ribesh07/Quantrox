import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { RolePermissionService } from "../services/role-permission.service";
import { Role, Permission } from "@prisma/client";

export const getAllRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const rolePermissions = await RolePermissionService.getAllRolePermissions();
    res.json({ success: true, rolePermissions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get role permissions" });
  }
};

export const getPermissionsByRole = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.params.role as Role;
    const permissions = await RolePermissionService.getPermissionsByRole(role);
    res.json({ success: true, permissions, role });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get permissions by role" });
  }
};

export const setRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.params.role as Role;
    const { permissions } = req.body as { permissions: Permission[] };
    const rolePermissions = await RolePermissionService.setRolePermissions(role, permissions);
    res.json({ success: true, rolePermissions, role });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to set role permissions" });
  }
};

export const addRolePermission = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.params.role as Role;
    const { permission } = req.body as { permission: Permission };
    const rolePermission = await RolePermissionService.addRolePermission(role, permission);
    res.json({ success: true, rolePermission });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add role permission" });
  }
};

export const removeRolePermission = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.params.role as Role;
    const { permission } = req.body as { permission: Permission };
    await RolePermissionService.removeRolePermission(role, permission);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove role permission" });
  }
};
