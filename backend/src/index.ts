import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import walletRoutes from './routes/wallet.routes';
import paymentRoutes from './routes/payment.routes';
import gameRoutes from './routes/game.routes';
import { logger } from './middleware/logger.middleware';
import { env } from './config/env';
import { ensureUploadDirectory, getUploadDirectory } from './utils/uploads';


const app = express();

const allowedOrigins = env.corsOrigins;
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use('/uploads', express.static(getUploadDirectory()));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payment-methods', paymentRoutes);
app.use('/api/games', gameRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[UNHANDLED_ERROR]', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const startServer = async () => {
  await ensureUploadDirectory('proofs');
  await ensureUploadDirectory('qrs');

  app.listen(env.port, () => {
    console.log(`Backend server running on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('[BOOT_ERROR]', error);
  process.exit(1);
});
