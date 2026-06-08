import { Router } from 'express';
import * as WalletController from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, WalletController.getUserWallets);

export default router;
