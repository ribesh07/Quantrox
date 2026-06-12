"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOrder = exports.getPendingOrders = exports.getAllOrders = exports.uploadProof = exports.getOrderById = exports.getUserStats = exports.getUserOrders = exports.createOrder = void 0;
const order_service_1 = require("../services/order.service");
const prisma_1 = require("../shared/prisma");
const schemas_1 = require("../shared/schemas");
const client_1 = require("@prisma/client");
const uploads_1 = require("../utils/uploads");
const createOrder = async (req, res) => {
    try {
        const validatedData = schemas_1.createOrderSchema.parse(req.body);
        const order = await order_service_1.OrderService.create({
            ...validatedData,
            userId: req.user.userId,
        });
        res.status(201).json({ success: true, order });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createOrder = createOrder;
const getUserOrders = async (req, res) => {
    try {
        const orders = await order_service_1.OrderService.getUserOrders(req.user.userId);
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserOrders = getUserOrders;
const getUserStats = async (req, res) => {
    try {
        const stats = await order_service_1.OrderService.getUserStats(req.user.userId);
        res.json({ success: true, stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserStats = getUserStats;
const getOrderById = async (req, res) => {
    try {
        const id = req.params.id;
        const order = await order_service_1.OrderService.getOrderById(id, req.user.userId, req.user.role !== 'USER');
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, order });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getOrderById = getOrderById;
const uploadProof = async (req, res) => {
    try {
        const id = req.params.id;
        const file = req.file;
        const note = req.body.note;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const imageUrl = await (0, uploads_1.saveUploadedFile)({
            tempPath: file.path,
            originalName: file.originalname,
            prefix: id,
            subdirectory: 'proofs',
        });
        const order = await prisma_1.prisma.order.update({
            where: { id },
            data: {
                screenshot: imageUrl,
                adminNote: note || null,
                status: client_1.OrderStatus.PENDING_REVIEW,
            },
        });
        res.json({ success: true, order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.uploadProof = uploadProof;
const getAllOrders = async (req, res) => {
    try {
        const orders = await order_service_1.OrderService.getAll();
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllOrders = getAllOrders;
const getPendingOrders = async (req, res) => {
    try {
        const orders = await order_service_1.OrderService.getPendingReviewOrders();
        res.json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPendingOrders = getPendingOrders;
const reviewOrder = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, adminNote } = req.body;
        const order = await order_service_1.OrderService.updateStatus(id, status, req.user.userId, adminNote);
        res.json({ success: true, order });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.reviewOrder = reviewOrder;
