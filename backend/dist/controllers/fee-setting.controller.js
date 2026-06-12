"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeeSetting = exports.updateFeeSetting = exports.createFeeSetting = exports.getFeeSettingById = exports.getFeeSettings = void 0;
const fee_setting_service_1 = require("../services/fee-setting.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getFeeSettings = async (req, res) => {
    try {
        const fees = await fee_setting_service_1.FeeSettingService.getAll();
        res.json({ success: true, fees });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFeeSettings = getFeeSettings;
const getFeeSettingById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const fee = await fee_setting_service_1.FeeSettingService.getById(id);
        if (!fee) {
            return res.status(404).json({ success: false, message: "Fee setting not found" });
        }
        res.json({ success: true, fee });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFeeSettingById = getFeeSettingById;
const createFeeSetting = async (req, res) => {
    try {
        const fee = await fee_setting_service_1.FeeSettingService.create(req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'CREATE_FEE_SETTING',
            resource: 'FeeSetting',
            resourceId: fee.id,
            result: 'SUCCESS',
        });
        res.status(201).json({ success: true, fee });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createFeeSetting = createFeeSetting;
const updateFeeSetting = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const oldFee = await fee_setting_service_1.FeeSettingService.getById(id);
        const fee = await fee_setting_service_1.FeeSettingService.update(id, req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'UPDATE_FEE_SETTING',
            resource: 'FeeSetting',
            resourceId: id,
            changes: { before: oldFee, after: fee },
            result: 'SUCCESS',
        });
        res.json({ success: true, fee });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateFeeSetting = updateFeeSetting;
const deleteFeeSetting = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await fee_setting_service_1.FeeSettingService.delete(id);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DELETE_FEE_SETTING',
            resource: 'FeeSetting',
            resourceId: id,
            result: 'SUCCESS',
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteFeeSetting = deleteFeeSetting;
