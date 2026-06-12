"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get user notifications
router.get('/', async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const result = await notification_service_1.NotificationService.getAll(req.user.userId, parseInt(limit), parseInt(offset));
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get unread count
router.get('/unread/count', async (req, res) => {
    try {
        const count = await notification_service_1.NotificationService.getUnreadCount(req.user.userId);
        res.json({ success: true, count });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get unread notifications
router.get('/unread', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const notifications = await notification_service_1.NotificationService.getUnread(req.user.userId, parseInt(limit));
        res.json({ success: true, notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const notification = await notification_service_1.NotificationService.markAsRead(id);
        res.json({ success: true, notification });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Mark all notifications as read
router.patch('/all/read', async (req, res) => {
    try {
        await notification_service_1.NotificationService.markAllAsRead(req.user.userId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await notification_service_1.NotificationService.delete(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Delete all notifications
router.delete('/', async (req, res) => {
    try {
        await notification_service_1.NotificationService.deleteAllForUser(req.user.userId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
