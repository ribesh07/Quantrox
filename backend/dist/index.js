"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const logger_middleware_1 = require("./middleware/logger.middleware");
const env_1 = require("./config/env");
const uploads_1 = require("./utils/uploads");
const app = (0, express_1.default)();
const allowedOrigins = env_1.env.corsOrigins;
app.use((0, cors_1.default)({
    credentials: true,
    origin: (origin, callback) => {
        if (!origin ||
            allowedOrigins.length === 0 ||
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('CORS origin not allowed'));
    },
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_middleware_1.logger);
app.use('/uploads', express_1.default.static((0, uploads_1.getUploadDirectory)()));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/wallets', wallet_routes_1.default);
app.use('/api/payment-methods', payment_routes_1.default);
app.use('/api/games', game_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
app.use((error, req, res, next) => {
    console.error('[UNHANDLED_ERROR]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
});
const startServer = async () => {
    await (0, uploads_1.ensureUploadDirectory)('proofs');
    await (0, uploads_1.ensureUploadDirectory)('qrs');
    app.listen(env_1.env.port, () => {
        console.log(`Backend server running on http://localhost:${env_1.env.port}`);
    });
};
startServer().catch((error) => {
    console.error('[BOOT_ERROR]', error);
    process.exit(1);
});
