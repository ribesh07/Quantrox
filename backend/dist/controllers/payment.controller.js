"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPublicPaymentMethods = exports.getAllPaymentMethods = void 0;
const payment_service_1 = require("../services/payment.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getAllPaymentMethods = async (req, res) => {
    try {
        const methods = await payment_service_1.PaymentService.getAllAdmin();
        res.json({ success: true, methods });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPublicPaymentMethods = async (req, res) => {
    try {
        const category = req.query.category;
        const methods = await payment_service_1.PaymentService.getAllActive(category);
        res.json({ success: true, methods });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPublicPaymentMethods = getPublicPaymentMethods;
const createPaymentMethod = async (req, res) => {
    try {
        const method = await payment_service_1.PaymentService.create(req.body, req.user.userId);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email || null,
            action: 'CREATE_PAYMENT_METHOD',
            resource: 'PaymentMethod',
            resourceId: method.id,
            result: 'SUCCESS',
        });
        res.status(201).json({ success: true, method });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = async (req, res) => {
    try {
        const id = req.params.id;
        const oldMethod = await payment_service_1.PaymentService.getById(id);
        const method = await payment_service_1.PaymentService.update(id, req.body, req.user.userId);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email || null,
            action: 'UPDATE_PAYMENT_METHOD',
            resource: 'PaymentMethod',
            resourceId: id,
            changes: { before: oldMethod, after: method },
            result: 'SUCCESS',
        });
        res.json({ success: true, method });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (req, res) => {
    try {
        const id = req.params.id;
        await payment_service_1.PaymentService.delete(id, req.user.userId);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email || null,
            action: 'DELETE_PAYMENT_METHOD',
            resource: 'PaymentMethod',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
