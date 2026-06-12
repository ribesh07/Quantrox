import { prisma } from "../shared/prisma";

export const SystemSettingsService = {
  async getSettings() {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          minExchangeAmount: 10,
          maxExchangeAmount: 50000,
          minGamePurchaseAmount: 5,
          maxGamePurchaseAmount: 10000,
          exchangeProcessTime: 300,
          requiresApprovalAmount: 5000,
          twoFactorRequired: false,
          maintenanceMode: false,
        },
      });
    }
    return settings;
  },

  async updateSettings(data: any) {
    const settings = await this.getSettings();
    return prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(data.minExchangeAmount !== undefined && { minExchangeAmount: parseFloat(data.minExchangeAmount) }),
        ...(data.maxExchangeAmount !== undefined && { maxExchangeAmount: parseFloat(data.maxExchangeAmount) }),
        ...(data.minGamePurchaseAmount !== undefined && { minGamePurchaseAmount: parseFloat(data.minGamePurchaseAmount) }),
        ...(data.maxGamePurchaseAmount !== undefined && { maxGamePurchaseAmount: parseFloat(data.maxGamePurchaseAmount) }),
        ...(data.exchangeProcessTime !== undefined && { exchangeProcessTime: parseInt(data.exchangeProcessTime) }),
        ...(data.requiresApprovalAmount !== undefined && { requiresApprovalAmount: parseFloat(data.requiresApprovalAmount) }),
        ...(data.twoFactorRequired !== undefined && { twoFactorRequired: data.twoFactorRequired }),
        ...(data.maintenanceMode !== undefined && { maintenanceMode: data.maintenanceMode }),
        ...(data.maintenanceMessage !== undefined && { maintenanceMessage: data.maintenanceMessage }),
      },
    });
  },

  async isMaintenanceMode() {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  },

  async getMaintenanceMessage() {
    const settings = await this.getSettings();
    return settings.maintenanceMessage;
  },
};

