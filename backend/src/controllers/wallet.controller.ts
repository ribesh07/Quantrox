import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { WalletService } from '../services/wallet.service';

export const getUserWallets = async (req: AuthRequest, res: Response) => {
  try {
    const wallets = await WalletService.getUserWallets(req.user!.userId);
    res.json({ success: true, wallets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
