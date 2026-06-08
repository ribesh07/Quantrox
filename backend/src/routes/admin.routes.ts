import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as OrderController from '../controllers/order.controller';
import * as UserController from '../controllers/user.controller';
import * as PaymentController from '../controllers/payment.controller';
import * as GameController from '../controllers/game.controller';
import * as QRController from '../controllers/qr.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply admin middleware to all routes
router.use(authenticate, authorize(['SUPER_ADMIN', 'STAFF_ADMIN']));

// Orders
router.get('/orders', OrderController.getAllOrders);
router.patch('/orders/:id/review', OrderController.reviewOrder);

// Users
router.get('/users', UserController.getAllUsers);
router.patch('/users/:id/role', UserController.updateUserRole);
router.delete('/users/:id', UserController.deleteUser);
router.get('/stats', UserController.getDashboardStats);

// Payment Methods
router.get('/payment-methods', PaymentController.getAllPaymentMethods);
router.patch('/payment-methods/:id', PaymentController.updatePaymentMethod);

// Games
router.get('/games', GameController.getAllGames);
router.post('/games', GameController.createGame);
router.patch('/games/:id', GameController.updateGame);
router.delete('/games/:id', GameController.deleteGame);

// QR Codes
router.get('/qr-codes', QRController.getAllQRCodes);
router.post('/qr-codes', upload.single('image'), QRController.createQRCode);
router.patch('/qr-codes/:id', QRController.updateQRCode);
router.delete('/qr-codes/:id', QRController.deleteQRCode);

export default router;
