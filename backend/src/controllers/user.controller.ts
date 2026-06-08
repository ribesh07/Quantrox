import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserService.getAll();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const user = await UserService.updateRole(id, role, req.user!.userId);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await UserService.delete(id, req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await UserService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
