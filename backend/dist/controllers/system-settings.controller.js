"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleMaintenanceMode = exports.updateSettings = exports.getSettings = void 0;
const system_settings_service_1 = require("../services/system-settings.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getSettings = async (req, res) => {
    try {
        const settings = await system_settings_service_1.SystemSettingsService.getSettings();
        res.json({ success: true, settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const oldSettings = await system_settings_service_1.SystemSettingsService.getSettings();
        const settings = await system_settings_service_1.SystemSettingsService.updateSettings(req.body);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'UPDATE_SYSTEM_SETTINGS',
            resource: 'SystemSettings',
            resourceId: settings.id,
            changes: { before: oldSettings, after: settings },
            result: 'SUCCESS',
        });
        res.json({ success: true, settings });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateSettings = updateSettings;
const toggleMaintenanceMode = async (req, res) => {
    try {
        const { maintenanceMode, maintenanceMessage } = req.body;
        const settings = await system_settings_service_1.SystemSettingsService.updateSettings({
            maintenanceMode,
            maintenanceMessage,
        });
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: maintenanceMode ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE',
            resource: 'SystemSettings',
            resourceId: settings.id,
            result: 'SUCCESS',
        });
        res.json({ success: true, settings });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.toggleMaintenanceMode = toggleMaintenanceMode;
