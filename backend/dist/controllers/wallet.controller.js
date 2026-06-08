"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWallets = void 0;
const wallet_service_1 = require("../services/wallet.service");
const getUserWallets = async (req, res) => {
    try {
        const wallets = await wallet_service_1.WalletService.getUserWallets(req.user.userId);
        res.json({ success: true, wallets });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserWallets = getUserWallets;
