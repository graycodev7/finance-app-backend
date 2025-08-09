import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshTokenModel } from '../models/RefreshToken';
import { logger } from './logger';

export interface TokenPayload {
  userId: number;
  email: string;
  jti?: string; // JWT ID for blacklisting
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  
  static generateTokenPair(userId: number, email: string, deviceInfo?: string, ipAddress?: string): Promise<TokenPair> {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate unique JTI for access token (for blacklisting)
        const jti = crypto.randomUUID();
        
        // Calculate expiry dates
        const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Generate access token with JTI
        const accessToken = jwt.sign(
          { 
            userId, 
            email,
            jti,
            type: 'access'
          },
          process.env.JWT_SECRET!,
          { 
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            issuer: 'finance-app',
            audience: 'finance-app-users'
          }
        );

        // Generate refresh token
        const refreshTokenPayload = {
          userId,
          type: 'refresh',
          jti: crypto.randomUUID()
        };

        const refreshToken = jwt.sign(
          refreshTokenPayload,
          process.env.REFRESH_SECRET || process.env.JWT_SECRET!,
          { 
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            issuer: 'finance-app',
            audience: 'finance-app-users'
          }
        );

        // Store refresh token in database
        await RefreshTokenModel.create({
          user_id: userId,
          token: refreshToken,
          expires_at: refreshTokenExpiry,
          device_info: deviceInfo,
          ip_address: ipAddress
        });

        resolve({
          accessToken,
          refreshToken,
          accessTokenExpiry,
          refreshTokenExpiry
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static verifyAccessToken(token: string): Promise<TokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as TokenPayload);
        }
      });
    });
  }

  static verifyRefreshToken(token: string): Promise<TokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token, 
        process.env.REFRESH_SECRET || process.env.JWT_SECRET!, 
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as TokenPayload);
          }
        }
      );
    });
  }

  static async refreshAccessToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database and is not revoked
      const storedToken = await RefreshTokenModel.findByToken(refreshToken);
      if (!storedToken) {
        throw new Error('Refresh token not found or expired');
      }

      // Import UserModel to get user info
      const { UserModel } = await import('../models/User');
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Revoke old refresh token
      await RefreshTokenModel.revokeToken(refreshToken);

      // Generate new token pair
      return await this.generateTokenPair(user.id, user.email, deviceInfo, ipAddress);
    } catch (error) {
      logger.error('Refresh token error', error);
      return null;
    }
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static getTokenJTI(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.jti || null;
    } catch (error) {
      return null;
    }
  }
}
