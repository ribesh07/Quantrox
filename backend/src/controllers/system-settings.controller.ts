import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SystemSettingsService } from '../services/system-settings.service';
import { AuditLogService } from '../services/audit-log.service';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await SystemSettingsService.getSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const oldSettings = await SystemSettingsService.getSettings();
    const settings = await SystemSettingsService.updateSettings(req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'UPDATE_SYSTEM_SETTINGS',
      resource: 'SystemSettings',
      resourceId: settings.id,
      changes: { before: oldSettings, after: settings },
      result: 'SUCCESS',
    });

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleMaintenanceMode = async (req: AuthRequest, res: Response) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await SystemSettingsService.updateSettings({
      maintenanceMode,
      maintenanceMessage,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: maintenanceMode ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE',
      resource: 'SystemSettings',
      resourceId: settings.id,
      result: 'SUCCESS',
    });

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
