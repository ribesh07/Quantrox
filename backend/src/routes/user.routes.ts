import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as PayoutRequestController from '../controllers/payout-request.controller';
import * as GameIdRequestController from '../controllers/game-id-request.controller';

const router = Router();

router.use(authenticate);

router.post('/payouts', PayoutRequestController.upload.single('qrCodeImage'), PayoutRequestController.createPayoutRequest);
router.get('/payouts', PayoutRequestController.getMyPayoutRequests);

router.post('/game-id-requests', GameIdRequestController.createGameIdRequest);
router.get('/game-id-requests', GameIdRequestController.getMyGameIdRequests);

export default router;
