import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PaymentAccountService } from '../services/payment-account.service';
import { AuditLogService } from '../services/audit-log.service';

export const getPaymentAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await PaymentAccountService.getAll();
    res.json({ success: true, accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentAccountById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const account = await PaymentAccountService.getById(id);
    if (!account) {
      return res.status(404).json({ success: false, message: "Payment account not found" });
    }
    res.json({ success: true, account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const account = await PaymentAccountService.create(req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_PAYMENT_ACCOUNT',
      resource: 'PaymentAccount',
      resourceId: account.id,
      result: 'SUCCESS',
    });

    res.status(201).json({ success: true, account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const oldAccount = await PaymentAccountService.getById(id);
    const account = await PaymentAccountService.update(id, req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'UPDATE_PAYMENT_ACCOUNT',
      resource: 'PaymentAccount',
      resourceId: id,
      changes: { before: oldAccount, after: account },
      result: 'SUCCESS',
    });

    res.json({ success: true, account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activatePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const account = await PaymentAccountService.activate(id);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'ACTIVATE_PAYMENT_ACCOUNT',
      resource: 'PaymentAccount',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true, account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deactivatePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const account = await PaymentAccountService.deactivate(id);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DEACTIVATE_PAYMENT_ACCOUNT',
      resource: 'PaymentAccount',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true, account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await PaymentAccountService.delete(id);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DELETE_PAYMENT_ACCOUNT',
      resource: 'PaymentAccount',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
