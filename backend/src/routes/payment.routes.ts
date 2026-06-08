import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.get('/', PaymentController.getPublicPaymentMethods);

export default router;
