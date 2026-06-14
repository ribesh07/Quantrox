import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', authenticate, OrderController.createOrder);
router.get('/', authenticate, OrderController.getUserOrders);
router.get('/stats', authenticate, OrderController.getUserStats);
router.get('/:id', authenticate, OrderController.getOrderById);
router.post('/:id/proof', authenticate, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'receiveQrCode', maxCount: 1 }]), OrderController.uploadProof);

export default router;
