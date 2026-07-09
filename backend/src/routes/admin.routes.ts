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
import * as MerchantInfoController from '../controllers/merchant-info.controller';
import * as MerchantQRCodeController from '../controllers/merchant-qr-code.controller';
import * as TransactionReportController from '../controllers/transaction-report.controller';
import * as DepositController from '../controllers/deposit.controller';
import * as PayoutRequestController from '../controllers/payout-request.controller';
import * as GameIdRequestController from '../controllers/game-id-request.controller';
import * as RolePermissionController from '../controllers/role-permission.controller';
import multer from 'multer';
import { getUploadDirectory } from '../utils/uploads';

const router = Router();
const upload = multer({ dest: getUploadDirectory(), limits: { fileSize: 50 * 1024 * 1024 } });

// Apply admin middleware to all routes
router.use(authenticate, authorize(['SUPER_ADMIN', 'STAFF_ADMIN', 'SUB_ADMIN','VENDOR']));

// Orders
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/pending', OrderController.getPendingOrders);
router.patch('/orders/:id/review', OrderController.reviewOrder);
router.patch('/orders/:id/admin-proof', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'adminProof', maxCount: 1 }]), OrderController.uploadAdminProof);

// Users
router.get('/users', UserController.getAllUsers);
router.post('/users', UserController.createUser);
router.patch('/users/:id/role', UserController.updateUserRole);
router.delete('/users/:id', UserController.deleteUser);
router.get('/stats', UserController.getDashboardStats);
router.get('/getuser/:id', UserController.getUserById);

// Payment Methods
router.get('/payment-methods', PaymentController.getAllPaymentMethods);
router.post('/payment-methods', upload.single('qrCode'), PaymentController.createPaymentMethod);
router.patch('/payment-methods/:id', upload.single('qrCode'), PaymentController.updatePaymentMethod);
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
router.post('/games', upload.single('logo'), GameController.createGame);
router.patch('/games/:id', upload.single('logo'), GameController.updateGame);
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

// Merchant Management
router.get('/merchants', MerchantInfoController.getAllMerchants);
router.get('/merchants/:userId', MerchantInfoController.getMerchantDetail);
router.post('/merchants', MerchantInfoController.createMerchant);
router.patch('/merchants/:userId/approve', MerchantInfoController.approveMerchant);
router.patch('/merchants/:userId/reject', MerchantInfoController.rejectMerchant);

// Merchant QR Codes
router.get('/merchant-qrs', MerchantQRCodeController.getAllMerchantQRCodes);
router.post('/merchant-qrs/:userId', MerchantQRCodeController.upload.single('image'), MerchantQRCodeController.assignMerchantQRCode);
router.post('/merchant-qrs/:userId/bulk', MerchantQRCodeController.bulkUpload.array('images', 10), MerchantQRCodeController.assignMultipleMerchantQRCodes);
router.post('/merchant-qrs/item/:qrId/replace', MerchantQRCodeController.upload.single('image'), MerchantQRCodeController.replaceMerchantQRCode);
router.patch('/merchant-qrs/:qrId/disable', MerchantQRCodeController.disableMerchantQRCode);
router.patch('/merchant-qrs/:qrId/enable', MerchantQRCodeController.enableMerchantQRCode);

// Transaction Reports
router.get('/transaction-reports', TransactionReportController.getAllTransactionReports);
router.patch('/transaction-reports/:id/approve', TransactionReportController.approveTransactionReport);
router.patch('/transaction-reports/:id/reject', TransactionReportController.rejectTransactionReport);

// Deposits
router.get('/deposits', DepositController.getAllDeposits);
router.patch('/deposits/:id/approve', DepositController.approveDeposit);
router.patch('/deposits/:id/reject', DepositController.rejectDeposit);
router.patch('/deposits/:id/freeze', DepositController.freezeDeposit);
router.patch('/deposits/:id/release', DepositController.releaseDeposit);
router.patch('/deposits/:id/adjust', DepositController.adjustDeposit);

// Payout Requests
router.get('/payout-requests', PayoutRequestController.getAllPayoutRequests);
router.patch('/payout-requests/:id/approve', PayoutRequestController.approvePayoutRequest);
router.patch('/payout-requests/:id/reject', PayoutRequestController.rejectPayoutRequest);
router.patch('/payout-requests/:id/mark-paid', upload.single('paymentProof'), PayoutRequestController.markPayoutPaid);

// Game ID Requests
router.get('/game-id-requests', GameIdRequestController.getAllGameIdRequests);
router.patch('/game-id-requests/:id/approve', GameIdRequestController.approveGameIdRequest);
router.patch('/game-id-requests/:id/reject', GameIdRequestController.rejectGameIdRequest);

// Role Permissions
router.get('/role-permissions', RolePermissionController.getAllRolePermissions);
router.get('/role-permissions/:role', RolePermissionController.getPermissionsByRole);
router.patch('/role-permissions/:role', RolePermissionController.setRolePermissions);
router.post('/role-permissions/:role/add', RolePermissionController.addRolePermission);
router.post('/role-permissions/:role/remove', RolePermissionController.removeRolePermission);

export default router;
