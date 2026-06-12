import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ExchangeRequestController from '../controllers/exchange-request.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/tmp' });

const router = Router();

router.use(authenticate);

// User routes
router.post('/', ExchangeRequestController.createExchangeRequest);
router.get('/my', ExchangeRequestController.getMyExchangeRequests);
router.get('/:id', ExchangeRequestController.getExchangeRequestById);
router.patch('/:id/cancel', ExchangeRequestController.cancelExchangeRequest);
router.post('/:id/proof', upload.single('proof'), ExchangeRequestController.uploadProof);

export default router;
