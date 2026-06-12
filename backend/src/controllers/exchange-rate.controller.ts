import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { AuditLogService } from '../services/audit-log.service';

export const getExchangeRates = async (req: AuthRequest, res: Response) => {
  try {
    const rates = await ExchangeRateService.getAll();
    res.json({ success: true, rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExchangeRateById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rate = await ExchangeRateService.getById(id as string);
    if (!rate) {
      return res.status(404).json({ success: false, message: "Exchange rate not found" });
    }
    res.json({ success: true, rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExchangeRateByPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const paymentMethodId = Array.isArray(req.params.paymentMethodId) ? req.params.paymentMethodId[0] : req.params.paymentMethodId;
    const rate = await ExchangeRateService.getByPaymentMethodId(paymentMethodId as string);
    if (!rate) {
      return res.status(404).json({ success: false, message: "No active exchange rate found" });
    }
    res.json({ success: true, rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const rate = await ExchangeRateService.create(req.body);
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_EXCHANGE_RATE',
      resource: 'ExchangeRate',
      resourceId: rate.id,
      result: 'SUCCESS',
    });

    res.status(201).json({ success: true, rate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const oldRate = await ExchangeRateService.getById(id as string);
    const rate = await ExchangeRateService.update(id as string, req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'UPDATE_EXCHANGE_RATE',
      resource: 'ExchangeRate',
      resourceId: id,
      changes: { before: oldRate, after: rate },
      result: 'SUCCESS',
    });

    res.json({ success: true, rate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deactivateExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rate = await ExchangeRateService.deactivate(id as string);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DEACTIVATE_EXCHANGE_RATE',
      resource: 'ExchangeRate',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true, rate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await ExchangeRateService.delete(id as string);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DELETE_EXCHANGE_RATE',
      resource: 'ExchangeRate',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
