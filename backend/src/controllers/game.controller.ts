import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GameService } from '../services/game.service';
export const getPublicGames = async (req: Request, res: Response) => {
  try {
    const games = await GameService.getAll(true);
    res.json({ success: true, games });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllGames = async (req: AuthRequest, res: Response) => {
  try {
    const games = await GameService.getAll();
    res.json({ success: true, games });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as any).file;
    if (file) {
      const savedPath = await import('../utils/uploads').then(m => m.saveUploadedFile({
        originalName: file.originalname,
        tempPath: file.path,
        subdirectory: 'games',
        prefix: req.body.name || 'game',
      }));
      req.body.logo = savedPath;
    }

    const game = await GameService.create(req.body, req.user!.userId);
    res.status(201).json({ success: true, game });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateGame = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const file = (req as any).file;
    if (file) {
      const savedPath = await import('../utils/uploads').then(m => m.saveUploadedFile({
        originalName: file.originalname,
        tempPath: file.path,
        subdirectory: 'games',
        prefix: id,
      }));
      req.body.logo = savedPath;
    }

    const game = await GameService.update(id, req.body, req.user!.userId);
    res.json({ success: true, game });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await GameService.delete(id, req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
