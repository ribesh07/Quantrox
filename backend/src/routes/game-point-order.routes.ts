import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as GamePointOrderController from '../controllers/game-point-order.controller';

const router = Router();

router.use(authenticate);

// User routes
router.post('/', GamePointOrderController.createGamePointOrder);
router.get('/my', GamePointOrderController.getMyGamePointOrders);
router.get('/:id', GamePointOrderController.getGamePointOrderById);
router.patch('/:id/cancel', GamePointOrderController.cancelGamePointOrder);

export default router;
