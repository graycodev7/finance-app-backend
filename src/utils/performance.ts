/**
 * Performance optimization utilities for production
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Response time middleware for monitoring
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Only log slow requests in production (>1000ms)
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Memory usage monitoring
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development') {
    const used = process.memoryUsage();
    const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    logger.debug('Memory usage', {
      rss: `${formatMemory(used.rss)} MB`,
      heapTotal: `${formatMemory(used.heapTotal)} MB`,
      heapUsed: `${formatMemory(used.heapUsed)} MB`,
      external: `${formatMemory(used.external)} MB`
    });
  }
};

// Database connection pool monitoring
export const monitorConnectionPool = (pool: any) => {
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      logger.debug('DB Pool status', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    }, 30000); // Every 30 seconds
  }
};
