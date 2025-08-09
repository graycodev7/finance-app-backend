import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiting para prevenir ataques de fuerza bruta (configuración para desarrollo)
export const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos (reducido para desarrollo)
  max: 20, // máximo 20 intentos por IP (aumentado para desarrollo)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general para APIs
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware para sanitizar entrada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remover caracteres peligrosos de strings
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
  };

  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  next();
};
