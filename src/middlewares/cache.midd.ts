import { Request, Response, NextFunction } from 'express';
import cacheManager from '../config/security/cache.config';
import { AuthRequest } from '../types';

export const cacheMiddleware = (ttl?: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Apenas cachear requisições GET
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `cache:${req.user?.id}:${req.originalUrl}`;
    const cachedData = cacheManager.get(key);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cachedData);
      return;
    }

    // Interceptar o método json para cachear a resposta
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      cacheManager.set(key, data, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};
