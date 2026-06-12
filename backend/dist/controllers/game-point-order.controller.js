"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelGamePointOrder = exports.failGamePointOrder = exports.fulfillGamePointOrder = exports.getPendingGamePointOrders = exports.getAllGamePointOrders = exports.getGamePointOrderById = exports.getMyGamePointOrders = exports.createGamePointOrder = void 0;
const game_point_order_service_1 = require("../services/game-point-order.service");
const audit_log_service_1 = require("../services/audit-log.service");
const notification_service_1 = require("../services/notification.service");
const createGamePointOrder = async (req, res) => {
    try {
        const { gameId, points, pricePerPoint, paymentMethodId, gameUsername } = req.body;
        if (!gameId || !points || !pricePerPoint || !paymentMethodId || !gameUsername) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const gamePointOrder = await game_point_order_service_1.GamePointOrderService.create({
            userId: req.user.userId,
            gameId,
            points: parseInt(points),
            pricePerPoint: parseFloat(pricePerPoint),
            paymentMethodId,
            gameUsername,
        });
        await notification_service_1.NotificationService.send({
            userId: req.user.userId,
            title: 'Game Points Order Created',
            message: `Order for ${points} points in game created. Total: $${gamePointOrder.finalPrice}`,
            type: 'SUCCESS',
            referenceType: 'GAME_ORDER',
            referenceId: gamePointOrder.id,
        });
        res.status(201).json({ success: true, gamePointOrder });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createGamePointOrder = createGamePointOrder;
const getMyGamePointOrders = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const orders = await game_point_order_service_1.GamePointOrderService.getByUserId(req.user.userId, parseInt(limit));
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyGamePointOrders = getMyGamePointOrders;
const getGamePointOrderById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'STAFF_ADMIN';
        const gamePointOrder = await game_point_order_service_1.GamePointOrderService.getById(id);
        if (!gamePointOrder) {
            return res.status(404).json({ success: false, message: "Game point order not found" });
        }
        if (!isAdmin && gamePointOrder.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        res.json({ success: true, gamePointOrder });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getGamePointOrderById = getGamePointOrderById;
// Admin endpoints
const getAllGamePointOrders = async (req, res) => {
    try {
        const { status, gameId, limit = 50, offset = 0 } = req.query;
        const filters = { limit: parseInt(limit), offset: parseInt(offset) };
        if (status) {
            filters.status = status;
        }
        if (gameId) {
            filters.gameId = gameId;
        }
        const result = await game_point_order_service_1.GamePointOrderService.getAll(filters);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllGamePointOrders = getAllGamePointOrders;
const getPendingGamePointOrders = async (req, res) => {
    try {
        const orders = await game_point_order_service_1.GamePointOrderService.getByStatus('PENDING');
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPendingGamePointOrders = getPendingGamePointOrders;
const fulfillGamePointOrder = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { notes } = req.body;
        const gamePointOrder = await game_point_order_service_1.GamePointOrderService.markFulfilled(id, notes);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'FULFILL_GAME_POINT_ORDER',
            resource: 'GamePointOrder',
            resourceId: id,
            result: 'SUCCESS',
        });
        await notification_service_1.NotificationService.send({
            userId: gamePointOrder.userId,
            title: 'Game Points Delivered',
            message: `Your ${gamePointOrder.points} game points have been successfully delivered to your account.`,
            type: 'SUCCESS',
            referenceType: 'GAME_ORDER',
            referenceId: gamePointOrder.id,
        });
        res.json({ success: true, gamePointOrder });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.fulfillGamePointOrder = fulfillGamePointOrder;
const failGamePointOrder = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason } = req.body;
        const gamePointOrder = await game_point_order_service_1.GamePointOrderService.markFailed(id, reason);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'FAIL_GAME_POINT_ORDER',
            resource: 'GamePointOrder',
            resourceId: id,
            result: 'SUCCESS',
        });
        await notification_service_1.NotificationService.send({
            userId: gamePointOrder.userId,
            title: 'Game Points Order Failed',
            message: `Your game points order failed. Reason: ${reason || 'Please contact support.'}`,
            type: 'ERROR',
            referenceType: 'GAME_ORDER',
            referenceId: gamePointOrder.id,
        });
        res.json({ success: true, gamePointOrder });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.failGamePointOrder = failGamePointOrder;
const cancelGamePointOrder = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason } = req.body;
        const gamePointOrder = await game_point_order_service_1.GamePointOrderService.cancel(id, reason);
        res.json({ success: true, gamePointOrder });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.cancelGamePointOrder = cancelGamePointOrder;
