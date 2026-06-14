import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';
import { prisma } from '../shared/prisma';
import { createOrderSchema } from '../shared/schemas';
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
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const note = req.body.note;

    const updateData: any = {
      adminNote: note || null,
      status: OrderStatus.PENDING_REVIEW,
    };

    if (files['file'] && files['file'][0]) {
      const imageUrl = await saveUploadedFile({
        tempPath: files['file'][0].path,
        originalName: files['file'][0].originalname,
        prefix: id,
        subdirectory: 'proofs',
      });
      updateData.screenshot = imageUrl;
    }

    if (files['receiveQrCode'] && files['receiveQrCode'][0]) {
      const qrUrl = await saveUploadedFile({
        tempPath: files['receiveQrCode'][0].path,
        originalName: files['receiveQrCode'][0].originalname,
        prefix: id,
        subdirectory: 'qrs',
      });
      updateData.receiveQrCode = qrUrl;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

export const getPendingOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderService.getPendingReviewOrders();
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



