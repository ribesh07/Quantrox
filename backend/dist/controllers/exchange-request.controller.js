"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProof = exports.cancelExchangeRequest = exports.rejectExchangeRequest = exports.approveExchangeRequest = exports.getPendingExchangeRequests = exports.getAllExchangeRequests = exports.getExchangeRequestById = exports.getMyExchangeRequests = exports.createExchangeRequest = void 0;
const exchange_request_service_1 = require("../services/exchange-request.service");
const prisma_1 = require("../shared/prisma");
const audit_log_service_1 = require("../services/audit-log.service");
const notification_service_1 = require("../services/notification.service");
const createExchangeRequest = async (req, res) => {
    try {
        const { amount, walletAddress, paymentMethodId } = req.body;
        if (!amount || !walletAddress || !paymentMethodId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const exchangeRequest = await exchange_request_service_1.ExchangeRequestService.create({
            userId: req.user.userId,
            amount: parseFloat(amount),
            walletAddress,
            paymentMethodId,
        });
        await notification_service_1.NotificationService.send({
            userId: req.user.userId,
            title: 'Exchange Request Created',
            message: `Exchange request for $${amount} created successfully.`,
            type: 'SUCCESS',
            referenceType: 'EXCHANGE',
            referenceId: exchangeRequest.id,
        });
        res.status(201).json({ success: true, exchangeRequest });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createExchangeRequest = createExchangeRequest;
const getMyExchangeRequests = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const requests = await exchange_request_service_1.ExchangeRequestService.getByUserId(req.user.userId, parseInt(limit));
        res.json({ success: true, requests });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyExchangeRequests = getMyExchangeRequests;
const getExchangeRequestById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'STAFF_ADMIN';
        const exchangeRequest = await exchange_request_service_1.ExchangeRequestService.getById(id);
        if (!exchangeRequest) {
            return res.status(404).json({ success: false, message: "Exchange request not found" });
        }
        if (!isAdmin && exchangeRequest.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        res.json({ success: true, exchangeRequest });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExchangeRequestById = getExchangeRequestById;
// Admin endpoints
const getAllExchangeRequests = async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        const filters = { limit: parseInt(limit), offset: parseInt(offset) };
        if (status) {
            filters.status = status;
        }
        const result = await exchange_request_service_1.ExchangeRequestService.getAll(filters);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllExchangeRequests = getAllExchangeRequests;
const getPendingExchangeRequests = async (req, res) => {
    try {
        const requests = await exchange_request_service_1.ExchangeRequestService.getAllByStatus('PENDING_PAYMENT');
        res.json({ success: true, requests });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPendingExchangeRequests = getPendingExchangeRequests;
const approveExchangeRequest = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { notes } = req.body;
        const exchangeRequest = await exchange_request_service_1.ExchangeRequestService.approve(id, notes);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'APPROVE_EXCHANGE_REQUEST',
            resource: 'ExchangeRequest',
            resourceId: id,
            result: 'SUCCESS',
        });
        await notification_service_1.NotificationService.send({
            userId: exchangeRequest.userId,
            title: 'Exchange Request Approved',
            message: `Your exchange request for $${exchangeRequest.amount} has been approved. USDT ${exchangeRequest.usdtReceived} will be transferred to your wallet.`,
            type: 'SUCCESS',
            referenceType: 'EXCHANGE',
            referenceId: exchangeRequest.id,
        });
        res.json({ success: true, exchangeRequest });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.approveExchangeRequest = approveExchangeRequest;
const rejectExchangeRequest = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason, notes } = req.body;
        if (!reason) {
            return res.status(400).json({ success: false, message: "Rejection reason required" });
        }
        const exchangeRequest = await exchange_request_service_1.ExchangeRequestService.reject(id, reason, notes);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'REJECT_EXCHANGE_REQUEST',
            resource: 'ExchangeRequest',
            resourceId: id,
            result: 'SUCCESS',
        });
        await notification_service_1.NotificationService.send({
            userId: exchangeRequest.userId,
            title: 'Exchange Request Rejected',
            message: `Your exchange request has been rejected. Reason: ${reason}`,
            type: 'ERROR',
            referenceType: 'EXCHANGE',
            referenceId: exchangeRequest.id,
        });
        res.json({ success: true, exchangeRequest });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.rejectExchangeRequest = rejectExchangeRequest;
const cancelExchangeRequest = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason } = req.body;
        const exchangeRequest = await exchange_request_service_1.ExchangeRequestService.cancel(id, reason);
        res.json({ success: true, exchangeRequest });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.cancelExchangeRequest = cancelExchangeRequest;
const uploadProof = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, message: 'Proof file required' });
        const savedPath = await Promise.resolve().then(() => __importStar(require('../utils/uploads'))).then(m => m.saveUploadedFile({
            originalName: file.originalname,
            tempPath: file.path,
            subdirectory: 'proofs',
            prefix: id,
        }));
        const proof = await exchange_request_service_1.ExchangeRequestService.getById(id);
        if (!proof)
            return res.status(404).json({ success: false, message: 'Exchange request not found' });
        const created = await prisma_1.prisma.proofUpload.create({
            data: {
                userId: req.user.userId,
                orderId: id,
                fileUrl: savedPath,
                fileType: file.mimetype,
                referenceNo: req.body.referenceNo || null,
                notes: req.body.notes || null,
            }
        });
        await exchange_request_service_1.ExchangeRequestService.markProofUploaded(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email || '',
            action: 'UPLOAD_EXCHANGE_PROOF',
            resource: 'ExchangeRequest',
            resourceId: id,
            result: 'SUCCESS',
        });
        await notification_service_1.NotificationService.send({
            userId: req.user.userId,
            title: 'Proof Uploaded',
            message: 'Your payment proof has been uploaded and is pending review.',
            type: 'INFO',
            referenceType: 'EXCHANGE',
            referenceId: id,
        });
        res.json({ success: true, proof: created });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.uploadProof = uploadProof;
