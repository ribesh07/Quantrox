import { Router } from 'express';
import * as TwoFAController from '../../controllers/auth/2fa.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Setup 2FA (requires auth)
router.post('/setup', authenticate, TwoFAController.setup2FA);

// Enable 2FA (requires auth)
router.post('/enable', authenticate, TwoFAController.enable2FA);

// Disable 2FA (requires auth)
router.post('/disable', authenticate, TwoFAController.disable2FA);

// Verify 2FA for login (does NOT require full auth, uses temp token)
router.post('/verify', TwoFAController.verify2FA);

export default router;
