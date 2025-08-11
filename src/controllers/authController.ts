import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, UpdateUserPreferences } from '../models/User';
import { RefreshTokenModel, BlacklistedTokenModel } from '../models/RefreshToken';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';

// Legacy function - replaced by JWTUtils.generateTokenPair
const generateToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' } // Shorter expiry for access tokens
  );
};

// Helper to get device info from request
const getDeviceInfo = (req: Request): string => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return userAgent.substring(0, 255); // Limit length
};

// Helper to get IP address
const getIpAddress = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'Unknown';
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Registration validation failed');
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, name, password, currency, language } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await UserModel.create({ email, name, password, currency, language });
    
    // Generate token pair with refresh token
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);
    const tokens = await JWTUtils.generateTokenPair(user.id, user.email, deviceInfo, ipAddress);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          language: user.language,
          email_notifications: user.email_notifications,
          push_notifications: user.push_notifications,
          weekly_reports: user.weekly_reports,
          budget_alerts: user.budget_alerts
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiry: tokens.accessTokenExpiry,
        refreshTokenExpiry: tokens.refreshTokenExpiry
      }
    });
  } catch (error) {
    logger.error('Register error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isValidPassword = await UserModel.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token pair with refresh token
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);
    const tokens = await JWTUtils.generateTokenPair(user.id, user.email, deviceInfo, ipAddress);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          language: user.language,
          email_notifications: user.email_notifications,
          push_notifications: user.push_notifications,
          weekly_reports: user.weekly_reports,
          budget_alerts: user.budget_alerts
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiry: tokens.accessTokenExpiry,
        refreshTokenExpiry: tokens.refreshTokenExpiry
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // User is already attached to req by auth middleware
    const user = (req as any).user;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          language: user.language,
          email_notifications: user.email_notifications,
          push_notifications: user.push_notifications,
          weekly_reports: user.weekly_reports,
          budget_alerts: user.budget_alerts
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const preferences: UpdateUserPreferences = req.body;

    // Update user preferences
    const updatedUser = await UserModel.updatePreferences(userId, preferences);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          currency: updatedUser.currency,
          language: updatedUser.language,
          email_notifications: updatedUser.email_notifications,
          push_notifications: updatedUser.push_notifications,
          weekly_reports: updatedUser.weekly_reports,
          budget_alerts: updatedUser.budget_alerts
        }
      }
    });
  } catch (error) {
    logger.error('Update preferences error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user!.id;
    const { name, email } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update profile
    const updatedUser = await UserModel.updateProfile(userId, { name, email });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          currency: updatedUser.currency,
          language: updatedUser.language,
          email_notifications: updatedUser.email_notifications,
          push_notifications: updatedUser.push_notifications,
          weekly_reports: updatedUser.weekly_reports,
          budget_alerts: updatedUser.budget_alerts
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Refresh access token using refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getIpAddress(req);
    
    const tokens = await JWTUtils.refreshAccessToken(refreshToken, deviceInfo, ipAddress);

    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiry: tokens.accessTokenExpiry,
        refreshTokenExpiry: tokens.refreshTokenExpiry
      }
    });
  } catch (error) {
    logger.error('Refresh token error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout - blacklist current token and revoke refresh tokens
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tokenJti = req.tokenJti;
    const { refreshToken, logoutAllDevices } = req.body;

    // Blacklist current access token if JTI is available
    if (tokenJti) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        const tokenExpiry = JWTUtils.getTokenExpiry(token);
        if (tokenExpiry) {
          await BlacklistedTokenModel.addToken(tokenJti, tokenExpiry);
        }
      }
    }

    // Revoke refresh token(s)
    if (logoutAllDevices) {
      // Revoke all refresh tokens for the user
      await RefreshTokenModel.revokeAllUserTokens(userId);
    } else if (refreshToken) {
      // Revoke specific refresh token
      await RefreshTokenModel.revokeToken(refreshToken);
    }

    res.json({
      success: true,
      message: logoutAllDevices ? 'Logged out from all devices' : 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get active sessions (refresh tokens) for the user
export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await RefreshTokenModel.findByUserId(userId);

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      expiresAt: session.expires_at
    }));

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        totalSessions: formattedSessions.length
      }
    });
  } catch (error) {
    logger.error('Get active sessions error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
