import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

const router = Router();

router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const result = await NotificationService.getAll(req.user!.userId, parseInt(limit as string), parseInt(offset as string));
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!.userId);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread notifications
router.get('/unread', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await NotificationService.getUnread(req.user!.userId, parseInt(limit as string));
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await NotificationService.markAsRead(id as string);
    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.patch('/all/read', async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await NotificationService.delete(id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete all notifications
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.deleteAllForUser(req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
