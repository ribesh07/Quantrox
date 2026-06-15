import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import walletRoutes from './routes/wallet.routes';
import paymentRoutes from './routes/payment.routes';
import gameRoutes from './routes/game.routes';
import exchangeRoutes from './routes/exchange.routes';
import gamePointOrderRoutes from './routes/game-point-order.routes';
import notificationRoutes from './routes/notification.routes';
import twoFactorRoutes from './routes/two-factor.routes';
import merchantRoutes from './routes/merchant.routes';
import { logger } from './middleware/logger.middleware';
import { env } from './config/env';
import { ensureUploadDirectory, getUploadDirectory } from './utils/uploads';
import { initPrisma } from './shared/prisma';


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
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/game-point-orders', gamePointOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/merchant', merchantRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/api/health', (req, res) => {
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
  await ensureUploadDirectory('games');
  await ensureUploadDirectory('reports');
  await ensureUploadDirectory('merchant-qrs');
  await ensureUploadDirectory('payout-qrs');

  // Initialize Prisma connection before starting the server
  try {
    await initPrisma();
  } catch (err) {
    console.error('[BOOT_ERROR] Prisma initialization failed:', err);
    // Fail fast — without DB the app cannot operate safely
    process.exit(1);
  }

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${env.port}`);
  });

  // WebSocket (Socket.IO) for real-time notifications
  try {
    // require() used to avoid ESM interop issues in ts-node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: env.corsOrigins.length ? env.corsOrigins : '*' } });

    // attach to global for other modules to use
    (global as any).io = io;
    io.on('connection', (socket: any) => {
      console.log('WS client connected', socket.id);
      socket.on('join', (userId: string) => {
        socket.join(`user_${userId}`);
      });
      socket.on('disconnect', () => {
        console.log('WS client disconnected', socket.id);
      });
    });
  } catch (err) {
    console.warn('Socket.IO not available:', err);
  }
};

startServer().catch((error) => {
  console.error('[BOOT_ERROR]', error);
  process.exit(1);
});
