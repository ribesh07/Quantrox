import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PaymentService } from '../services/payment.service';
import { PaymentMethodCategory } from '@prisma/client';

export const getAllPaymentMethods = async (req: AuthRequest, res: Response) => {
  try {
    const methods = await PaymentService.getAllAdmin();
    res.json({ success: true, methods });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicPaymentMethods = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as PaymentMethodCategory | undefined;
    const methods = await PaymentService.getAllActive(category);
    res.json({ success: true, methods });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const method = await PaymentService.update(id, req.body, req.user!.userId);
    res.json({ success: true, method });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
