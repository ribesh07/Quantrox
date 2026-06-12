import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GamePointOrderService } from '../services/game-point-order.service';
import { AuditLogService } from '../services/audit-log.service';
import { NotificationService } from '../services/notification.service';

export const createGamePointOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId, points, pricePerPoint, paymentMethodId, gameUsername } = req.body;

    if (!gameId || !points || !pricePerPoint || !paymentMethodId || !gameUsername) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const gamePointOrder = await GamePointOrderService.create({
      userId: req.user!.userId,
      gameId,
      points: parseInt(points),
      pricePerPoint: parseFloat(pricePerPoint),
      paymentMethodId,
      gameUsername,
    });

    await NotificationService.send({
      userId: req.user!.userId,
      title: 'Game Points Order Created',
      message: `Order for ${points} points in game created. Total: $${gamePointOrder.finalPrice}`,
      type: 'SUCCESS',
      referenceType: 'GAME_ORDER',
      referenceId: gamePointOrder.id,
    });

    res.status(201).json({ success: true, gamePointOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyGamePointOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const orders = await GamePointOrderService.getByUserId(req.user!.userId, parseInt(limit as string));

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGamePointOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'STAFF_ADMIN';

    const gamePointOrder = await GamePointOrderService.getById(id as string);
    if (!gamePointOrder) {
      return res.status(404).json({ success: false, message: "Game point order not found" });
    }

    if (!isAdmin && gamePointOrder.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, gamePointOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin endpoints
export const getAllGamePointOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, gameId, limit = 50, offset = 0 } = req.query;
    const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
    if (status) {
      filters.status = status;
    }
    if (gameId) {
      filters.gameId = gameId;
    }

    const result = await GamePointOrderService.getAll(filters);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingGamePointOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await GamePointOrderService.getByStatus('PENDING');
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fulfillGamePointOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { notes } = req.body;

    const gamePointOrder = await GamePointOrderService.markFulfilled(id as string, notes);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'FULFILL_GAME_POINT_ORDER',
      resource: 'GamePointOrder',
      resourceId: id,
      result: 'SUCCESS',
    });

    await NotificationService.send({
      userId: gamePointOrder.userId,
      title: 'Game Points Delivered',
      message: `Your ${gamePointOrder.points} game points have been successfully delivered to your account.`,
      type: 'SUCCESS',
      referenceType: 'GAME_ORDER',
      referenceId: gamePointOrder.id,
    });

    res.json({ success: true, gamePointOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const failGamePointOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    const gamePointOrder = await GamePointOrderService.markFailed(id as string, reason);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'FAIL_GAME_POINT_ORDER',
      resource: 'GamePointOrder',
      resourceId: id,
      result: 'SUCCESS',
    });

    await NotificationService.send({
      userId: gamePointOrder.userId,
      title: 'Game Points Order Failed',
      message: `Your game points order failed. Reason: ${reason || 'Please contact support.'}`,
      type: 'ERROR',
      referenceType: 'GAME_ORDER',
      referenceId: gamePointOrder.id,
    });

    res.json({ success: true, gamePointOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelGamePointOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    const gamePointOrder = await GamePointOrderService.cancel(id as string, reason);

    res.json({ success: true, gamePointOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
