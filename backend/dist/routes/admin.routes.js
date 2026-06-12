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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const OrderController = __importStar(require("../controllers/order.controller"));
const UserController = __importStar(require("../controllers/user.controller"));
const PaymentController = __importStar(require("../controllers/payment.controller"));
const GameController = __importStar(require("../controllers/game.controller"));
const QRController = __importStar(require("../controllers/qr.controller"));
const ExchangeRateController = __importStar(require("../controllers/exchange-rate.controller"));
const FeeSettingController = __importStar(require("../controllers/fee-setting.controller"));
const SystemSettingsController = __importStar(require("../controllers/system-settings.controller"));
const PaymentAccountController = __importStar(require("../controllers/payment-account.controller"));
const ExchangeRequestController = __importStar(require("../controllers/exchange-request.controller"));
const GamePointOrderController = __importStar(require("../controllers/game-point-order.controller"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Apply admin middleware to all routes
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['SUPER_ADMIN', 'STAFF_ADMIN']));
// Orders
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/pending', OrderController.getPendingOrders);
router.patch('/orders/:id/review', OrderController.reviewOrder);
// Users
router.get('/users', UserController.getAllUsers);
router.patch('/users/:id/role', UserController.updateUserRole);
router.delete('/users/:id', UserController.deleteUser);
router.get('/stats', UserController.getDashboardStats);
// Payment Methods
router.get('/payment-methods', PaymentController.getAllPaymentMethods);
router.post('/payment-methods', PaymentController.createPaymentMethod);
router.patch('/payment-methods/:id', PaymentController.updatePaymentMethod);
router.delete('/payment-methods/:id', PaymentController.deletePaymentMethod);
// Payment Accounts
router.get('/payment-accounts', PaymentAccountController.getPaymentAccounts);
router.get('/payment-accounts/:id', PaymentAccountController.getPaymentAccountById);
router.post('/payment-accounts', PaymentAccountController.createPaymentAccount);
router.patch('/payment-accounts/:id', PaymentAccountController.updatePaymentAccount);
router.patch('/payment-accounts/:id/activate', PaymentAccountController.activatePaymentAccount);
router.patch('/payment-accounts/:id/deactivate', PaymentAccountController.deactivatePaymentAccount);
router.delete('/payment-accounts/:id', PaymentAccountController.deletePaymentAccount);
// Exchange Rates
router.get('/exchange-rates', ExchangeRateController.getExchangeRates);
router.get('/exchange-rates/:id', ExchangeRateController.getExchangeRateById);
router.get('/exchange-rates/payment-method/:paymentMethodId', ExchangeRateController.getExchangeRateByPaymentMethod);
router.post('/exchange-rates', ExchangeRateController.createExchangeRate);
router.patch('/exchange-rates/:id', ExchangeRateController.updateExchangeRate);
router.patch('/exchange-rates/:id/deactivate', ExchangeRateController.deactivateExchangeRate);
router.delete('/exchange-rates/:id', ExchangeRateController.deleteExchangeRate);
// Fee Settings
router.get('/fee-settings', FeeSettingController.getFeeSettings);
router.get('/fee-settings/:id', FeeSettingController.getFeeSettingById);
router.post('/fee-settings', FeeSettingController.createFeeSetting);
router.patch('/fee-settings/:id', FeeSettingController.updateFeeSetting);
router.delete('/fee-settings/:id', FeeSettingController.deleteFeeSetting);
// System Settings
router.get('/system-settings', SystemSettingsController.getSettings);
router.patch('/system-settings', SystemSettingsController.updateSettings);
router.patch('/system-settings/maintenance', SystemSettingsController.toggleMaintenanceMode);
// Games
router.get('/games', GameController.getAllGames);
router.post('/games', GameController.createGame);
router.patch('/games/:id', GameController.updateGame);
router.delete('/games/:id', GameController.deleteGame);
// QR Codes
router.get('/qr-codes', QRController.getAllQRCodes);
router.post('/qr-codes', upload.single('image'), QRController.createQRCode);
router.patch('/qr-codes/:id', QRController.updateQRCode);
router.delete('/qr-codes/:id', QRController.deleteQRCode);
// Exchange Requests (Admin)
router.get('/exchange-requests', ExchangeRequestController.getAllExchangeRequests);
router.get('/exchange-requests/pending', ExchangeRequestController.getPendingExchangeRequests);
router.get('/exchange-requests/:id', ExchangeRequestController.getExchangeRequestById);
router.patch('/exchange-requests/:id/approve', ExchangeRequestController.approveExchangeRequest);
router.patch('/exchange-requests/:id/reject', ExchangeRequestController.rejectExchangeRequest);
// Game Point Orders (Admin)
router.get('/game-point-orders', GamePointOrderController.getAllGamePointOrders);
router.get('/game-point-orders/pending', GamePointOrderController.getPendingGamePointOrders);
router.get('/game-point-orders/:id', GamePointOrderController.getGamePointOrderById);
router.patch('/game-point-orders/:id/fulfill', GamePointOrderController.fulfillGamePointOrder);
router.patch('/game-point-orders/:id/fail', GamePointOrderController.failGamePointOrder);
exports.default = router;
