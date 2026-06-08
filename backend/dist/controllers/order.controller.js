"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOrder = exports.getAllOrders = exports.uploadProof = exports.getOrderById = exports.getUserStats = exports.getUserOrders = exports.createOrder = void 0;
const order_service_1 = require("../services/order.service");
const shared_1 = require("@quantrox/shared");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const createOrder = async (req, res) => {
    try {
        const validatedData = shared_1.createOrderSchema.parse(req.body);
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
        const uploadDir = path_1.default.join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'proofs');
        await promises_1.default.mkdir(uploadDir, { recursive: true });
        const filename = `${id}-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
        const targetPath = path_1.default.join(uploadDir, filename);
        await promises_1.default.rename(file.path, targetPath);
        const imageUrl = `/uploads/proofs/${filename}`;
        const order = await shared_1.prisma.order.update({
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
