import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ExchangeRequestController from '../controllers/exchange-request.controller';

const router = Router();

router.use(authenticate);

// User routes
router.post('/', ExchangeRequestController.createExchangeRequest);
router.get('/my', ExchangeRequestController.getMyExchangeRequests);
router.get('/:id', ExchangeRequestController.getExchangeRequestById);
router.patch('/:id/cancel', ExchangeRequestController.cancelExchangeRequest);

export default router;
