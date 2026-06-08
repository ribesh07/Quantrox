"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const logger_middleware_1 = require("./middleware/logger.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(logger_middleware_1.logger);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/wallets', wallet_routes_1.default);
app.use('/api/payment-methods', payment_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
