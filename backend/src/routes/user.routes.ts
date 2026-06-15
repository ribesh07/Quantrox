import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as PayoutRequestController from '../controllers/payout-request.controller';

const router = Router();

router.use(authenticate);

router.post('/payouts', PayoutRequestController.upload.single('qrCodeImage'), PayoutRequestController.createUserPayoutRequest);
router.get('/payouts', PayoutRequestController.getMyUserPayoutRequests);

export default router;
