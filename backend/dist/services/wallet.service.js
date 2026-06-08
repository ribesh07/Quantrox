"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const shared_1 = require("@quantrox/shared");
exports.WalletService = {
    async getUserWallets(userId) {
        return shared_1.prisma.wallet.findMany({
            where: { userId },
            include: {
                paymentMethod: true,
            },
        });
    },
    async getBalanceByMethod(userId, paymentMethodId) {
        return shared_1.prisma.wallet.findUnique({
            where: {
                userId_paymentMethodId: {
                    userId,
                    paymentMethodId
                }
            }
        });
    }
};
