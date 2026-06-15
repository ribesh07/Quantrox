import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as MerchantInfoController from '../controllers/merchant-info.controller';
import * as MerchantQRCodeController from '../controllers/merchant-qr-code.controller';
import * as TransactionReportController from '../controllers/transaction-report.controller';
import * as DepositController from '../controllers/deposit.controller';
import * as PayoutRequestController from '../controllers/payout-request.controller';

const router = Router();

router.use(authenticate);

// Merchant Info
router.post('/info', MerchantInfoController.createMerchantInfo);
router.get('/info', MerchantInfoController.getMyMerchantInfo);
router.put('/info', MerchantInfoController.updateMyMerchantInfo);

// Merchant QR Code
router.get('/qr', MerchantQRCodeController.getMyMerchantQRCode);

// Transaction Reports
router.post('/reports', TransactionReportController.upload.single('proofImage'), TransactionReportController.createTransactionReport);
router.get('/reports', TransactionReportController.getMyTransactionReports);

// Deposits
router.post('/deposits', DepositController.createDeposit);
router.get('/deposits', DepositController.getMyDeposits);
router.get('/deposits/total', DepositController.getMyTotalDeposit);

// Payout Requests (merchant wallet-based)
router.post('/payouts', PayoutRequestController.upload.single('qrCodeImage'), PayoutRequestController.createMerchantPayoutRequest);
router.get('/payouts', PayoutRequestController.getMyMerchantPayoutRequests);
router.put('/payouts/:id/submit', PayoutRequestController.submitPayoutForReview);

export default router;
