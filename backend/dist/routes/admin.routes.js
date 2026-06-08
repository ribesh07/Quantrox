"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const OrderController = __importStar(require("../controllers/order.controller"));
const UserController = __importStar(require("../controllers/user.controller"));
const PaymentController = __importStar(require("../controllers/payment.controller"));
const GameController = __importStar(require("../controllers/game.controller"));
const QRController = __importStar(require("../controllers/qr.controller"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Apply admin middleware to all routes
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['SUPER_ADMIN', 'STAFF_ADMIN']));
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
exports.default = router;
