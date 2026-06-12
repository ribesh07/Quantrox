"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExchangeRate = exports.deactivateExchangeRate = exports.updateExchangeRate = exports.createExchangeRate = exports.getExchangeRateByPaymentMethod = exports.getExchangeRateById = exports.getExchangeRates = void 0;
const exchange_rate_service_1 = require("../services/exchange-rate.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getExchangeRates = async (req, res) => {
    try {
        const rates = await exchange_rate_service_1.ExchangeRateService.getAll();
        res.json({ success: true, rates });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExchangeRates = getExchangeRates;
const getExchangeRateById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const rate = await exchange_rate_service_1.ExchangeRateService.getById(id);
        if (!rate) {
            return res.status(404).json({ success: false, message: "Exchange rate not found" });
        }
        res.json({ success: true, rate });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExchangeRateById = getExchangeRateById;
const getExchangeRateByPaymentMethod = async (req, res) => {
    try {
        const paymentMethodId = Array.isArray(req.params.paymentMethodId) ? req.params.paymentMethodId[0] : req.params.paymentMethodId;
        const rate = await exchange_rate_service_1.ExchangeRateService.getByPaymentMethodId(paymentMethodId);
        if (!rate) {
            return res.status(404).json({ success: false, message: "No active exchange rate found" });
        }
        res.json({ success: true, rate });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExchangeRateByPaymentMethod = getExchangeRateByPaymentMethod;
const createExchangeRate = async (req, res) => {
    try {
        const rate = await exchange_rate_service_1.ExchangeRateService.create(req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'CREATE_EXCHANGE_RATE',
            resource: 'ExchangeRate',
            resourceId: rate.id,
            result: 'SUCCESS',
        });
        res.status(201).json({ success: true, rate });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createExchangeRate = createExchangeRate;
const updateExchangeRate = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const oldRate = await exchange_rate_service_1.ExchangeRateService.getById(id);
        const rate = await exchange_rate_service_1.ExchangeRateService.update(id, req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'UPDATE_EXCHANGE_RATE',
            resource: 'ExchangeRate',
            resourceId: id,
            changes: { before: oldRate, after: rate },
            result: 'SUCCESS',
        });
        res.json({ success: true, rate });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateExchangeRate = updateExchangeRate;
const deactivateExchangeRate = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const rate = await exchange_rate_service_1.ExchangeRateService.deactivate(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DEACTIVATE_EXCHANGE_RATE',
            resource: 'ExchangeRate',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true, rate });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deactivateExchangeRate = deactivateExchangeRate;
const deleteExchangeRate = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await exchange_rate_service_1.ExchangeRateService.delete(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DELETE_EXCHANGE_RATE',
            resource: 'ExchangeRate',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteExchangeRate = deleteExchangeRate;
