import { Request, Response, NextFunction } from 'express';
import { expressLogger } from '../utils/logger';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  return expressLogger(req, res, next);
};
