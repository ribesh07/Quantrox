import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as OrderController from '../controllers/order.controller';
import * as UserController from '../controllers/user.controller';
import * as PaymentController from '../controllers/payment.controller';
import * as GameController from '../controllers/game.controller';
import * as QRController from '../controllers/qr.controller';
import * as ExchangeRateController from '../controllers/exchange-rate.controller';
import * as FeeSettingController from '../controllers/fee-setting.controller';
import * as SystemSettingsController from '../controllers/system-settings.controller';
import * as PaymentAccountController from '../controllers/payment-account.controller';
import * as ExchangeRequestController from '../controllers/exchange-request.controller';
import * as GamePointOrderController from '../controllers/game-point-order.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply admin middleware to all routes
router.use(authenticate, authorize(['SUPER_ADMIN', 'STAFF_ADMIN']));

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

export default router;
