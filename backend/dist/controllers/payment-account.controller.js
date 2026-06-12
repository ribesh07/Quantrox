"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentAccount = exports.deactivatePaymentAccount = exports.activatePaymentAccount = exports.updatePaymentAccount = exports.createPaymentAccount = exports.getPaymentAccountById = exports.getPaymentAccounts = void 0;
const payment_account_service_1 = require("../services/payment-account.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getPaymentAccounts = async (req, res) => {
    try {
        const accounts = await payment_account_service_1.PaymentAccountService.getAll();
        res.json({ success: true, accounts });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPaymentAccounts = getPaymentAccounts;
const getPaymentAccountById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const account = await payment_account_service_1.PaymentAccountService.getById(id);
        if (!account) {
            return res.status(404).json({ success: false, message: "Payment account not found" });
        }
        res.json({ success: true, account });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPaymentAccountById = getPaymentAccountById;
const createPaymentAccount = async (req, res) => {
    try {
        const account = await payment_account_service_1.PaymentAccountService.create(req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'CREATE_PAYMENT_ACCOUNT',
            resource: 'PaymentAccount',
            resourceId: account.id,
            result: 'SUCCESS',
        });
        res.status(201).json({ success: true, account });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createPaymentAccount = createPaymentAccount;
const updatePaymentAccount = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const oldAccount = await payment_account_service_1.PaymentAccountService.getById(id);
        const account = await payment_account_service_1.PaymentAccountService.update(id, req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'UPDATE_PAYMENT_ACCOUNT',
            resource: 'PaymentAccount',
            resourceId: id,
            changes: { before: oldAccount, after: account },
            result: 'SUCCESS',
        });
        res.json({ success: true, account });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updatePaymentAccount = updatePaymentAccount;
const activatePaymentAccount = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const account = await payment_account_service_1.PaymentAccountService.activate(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'ACTIVATE_PAYMENT_ACCOUNT',
            resource: 'PaymentAccount',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true, account });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.activatePaymentAccount = activatePaymentAccount;
const deactivatePaymentAccount = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const account = await payment_account_service_1.PaymentAccountService.deactivate(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DEACTIVATE_PAYMENT_ACCOUNT',
            resource: 'PaymentAccount',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true, account });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deactivatePaymentAccount = deactivatePaymentAccount;
const deletePaymentAccount = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await payment_account_service_1.PaymentAccountService.delete(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DELETE_PAYMENT_ACCOUNT',
            resource: 'PaymentAccount',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deletePaymentAccount = deletePaymentAccount;
