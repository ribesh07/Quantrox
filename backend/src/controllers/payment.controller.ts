import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PaymentService } from '../services/payment.service';
import { AuditLogService } from '../services/audit-log.service';
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

export const createPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const method = await PaymentService.create(req.body, req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: (req.user as any).email || null,
      action: 'CREATE_PAYMENT_METHOD',
      resource: 'PaymentMethod',
      resourceId: method.id,
      result: 'SUCCESS',
    });

    res.status(201).json({ success: true, method });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const oldMethod = await PaymentService.getById(id);
    const method = await PaymentService.update(id, req.body, req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: (req.user as any).email || null,
      action: 'UPDATE_PAYMENT_METHOD',
      resource: 'PaymentMethod',
      resourceId: id,
      changes: { before: oldMethod, after: method },
      result: 'SUCCESS',
    });

    res.json({ success: true, method });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await PaymentService.delete(id, req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: (req.user as any).email || null,
      action: 'DELETE_PAYMENT_METHOD',
      resource: 'PaymentMethod',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
