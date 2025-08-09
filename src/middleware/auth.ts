import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { BlacklistedTokenModel } from '../models/RefreshToken';
import { logger } from '../utils/logger';
import { JWTUtils } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    currency?: string;
    language?: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    weekly_reports?: boolean;
    budget_alerts?: boolean;
  };
  tokenJti?: string; // For logout functionality
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token using JWT utils
    const decoded = await JWTUtils.verifyAccessToken(token);
    
    // Check if token is blacklisted (for secure logout)
    if (decoded.jti) {
      const isBlacklisted = await BlacklistedTokenModel.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has been revoked' 
        });
      }
    }

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      language: user.language,
      email_notifications: user.email_notifications,
      push_notifications: user.push_notifications,
      weekly_reports: user.weekly_reports,
      budget_alerts: user.budget_alerts
    };
    req.tokenJti = decoded.jti; // Store JTI for logout

    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};
