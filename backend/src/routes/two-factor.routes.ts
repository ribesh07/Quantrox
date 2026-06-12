import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as TwoFactorController from '../controllers/two-factor.controller';

const router = Router();

router.use(authenticate);

// Get 2FA setup QR code
router.get('/setup', TwoFactorController.getSetupQRCode);

// Enable 2FA
router.post('/enable', TwoFactorController.enable2FA);

// Disable 2FA
router.post('/disable', TwoFactorController.disable2FA);

// Verify 2FA login
router.post('/verify', TwoFactorController.verify2FALogin);

// Get 2FA status
router.get('/status', TwoFactorController.get2FAStatus);

// Get backup codes
router.get('/backup-codes', TwoFactorController.getBackupCodes);

// Regenerate backup codes
router.post('/backup-codes/regenerate', TwoFactorController.regenerateBackupCodes);

export default router;
