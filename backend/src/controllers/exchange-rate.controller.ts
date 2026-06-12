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
    const { id } = req.params;
    const rate = await ExchangeRateService.getById(id);
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
    const { paymentMethodId } = req.params;
    const rate = await ExchangeRateService.getByPaymentMethodId(paymentMethodId);
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
    const { id } = req.params;
    const oldRate = await ExchangeRateService.getById(id);
    const rate = await ExchangeRateService.update(id, req.body);

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
    const { id } = req.params;
    const rate = await ExchangeRateService.deactivate(id);

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
    const { id } = req.params;
    await ExchangeRateService.delete(id);

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
