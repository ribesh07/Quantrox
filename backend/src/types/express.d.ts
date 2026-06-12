import 'express';

declare global {
  namespace Express {
    interface Request {
      // Treat route params as simple string map for our controllers
      params: { [key: string]: string };
    }
  }
}

export {};
