import { Router } from 'express';
import * as GameController from '../controllers/game.controller';

const router = Router();

router.get('/', GameController.getPublicGames);

export default router;
