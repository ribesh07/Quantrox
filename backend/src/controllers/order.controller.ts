import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';
import { createOrderSchema, prisma } from '@quantrox/shared';
import { OrderStatus } from '@prisma/client';
import { saveUploadedFile } from '../utils/uploads';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await OrderService.create({
      ...validatedData,
      userId: req.user!.userId,
    } as any);
    res.status(201).json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderService.getUserOrders(req.user!.userId);
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await OrderService.getUserStats(req.user!.userId);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await OrderService.getOrderById(id, req.user!.userId, req.user!.role !== 'USER');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadProof = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const file = req.file;
    const note = req.body.note;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const imageUrl = await saveUploadedFile({
      tempPath: file.path,
      originalName: file.originalname,
      prefix: id,
      subdirectory: 'proofs',
    });

    const order = await prisma.order.update({
      where: { id },
      data: {
        screenshot: imageUrl,
        adminNote: note || null,
        status: OrderStatus.PENDING_REVIEW,
      },
    });

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderService.getAll();
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, adminNote } = req.body;
    const order = await OrderService.updateStatus(id, status, req.user!.userId, adminNote);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
