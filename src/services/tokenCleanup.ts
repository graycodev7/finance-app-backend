import { RefreshTokenModel, BlacklistedTokenModel } from '../models/RefreshToken';
import pool from '../config/database';
import { logger } from '../utils/logger';

export class TokenCleanupService {
  private static instance: TokenCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}

  static getInstance(): TokenCleanupService {
    if (!TokenCleanupService.instance) {
      TokenCleanupService.instance = new TokenCleanupService();
    }
    return TokenCleanupService.instance;
  }

  // Start periodic cleanup (every 24 hours)
  startPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    // Run immediately on start
    this.performCleanup();
    
    // Then run every 24 hours
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    if (process.env.NODE_ENV !== 'production') {
      logger.info('Token cleanup service started (runs every 24 hours)');
    }
  }

  // Stop periodic cleanup
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Token cleanup service stopped');
    }
  }

  // Perform the actual cleanup
  private async performCleanup(): Promise<void> {
    try {
      const [expiredRefreshTokens, expiredBlacklistedTokens] = await Promise.all([
        RefreshTokenModel.deleteExpiredTokens(),
        BlacklistedTokenModel.deleteExpiredTokens()
      ]);

      // Only log if tokens were actually removed or in development
      if (expiredRefreshTokens > 0 || expiredBlacklistedTokens > 0 || process.env.NODE_ENV !== 'production') {
        logger.info(`Token cleanup: ${expiredRefreshTokens} refresh, ${expiredBlacklistedTokens} blacklisted tokens removed`);
      }
    } catch (error) {
      logger.error('Error during token cleanup', error);
    }
  }

  // Manual cleanup (can be called via API or admin interface)
  async runManualCleanup(): Promise<{ refreshTokens: number; blacklistedTokens: number }> {
    try {
      const [expiredRefreshTokens, expiredBlacklistedTokens] = await Promise.all([
        RefreshTokenModel.deleteExpiredTokens(),
        BlacklistedTokenModel.deleteExpiredTokens()
      ]);

      return {
        refreshTokens: expiredRefreshTokens,
        blacklistedTokens: expiredBlacklistedTokens
      };
    } catch (error) {
      logger.error('Error during manual token cleanup', error);
      throw error;
    }
  }
}
