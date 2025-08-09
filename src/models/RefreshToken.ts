import pool from '../config/database';

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  is_revoked: boolean;
  device_info?: string;
  ip_address?: string;
}

export interface CreateRefreshTokenData {
  user_id: number;
  token: string;
  expires_at: Date;
  device_info?: string;
  ip_address?: string;
}

export class RefreshTokenModel {
  static async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.token,
      data.expires_at,
      data.device_info || null,
      data.ip_address || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByToken(token: string): Promise<RefreshToken | null> {
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE token = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  static async revokeToken(token: string): Promise<boolean> {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE token = $1
    `;
    
    const result = await pool.query(query, [token]);
    return result.rowCount > 0;
  }

  static async revokeAllUserTokens(userId: number): Promise<number> {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_revoked = FALSE
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rowCount;
  }

  static async deleteExpiredTokens(): Promise<number> {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE
    `;
    
    const result = await pool.query(query);
    return result.rowCount;
  }

  static async findByUserId(userId: number): Promise<RefreshToken[]> {
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

// Blacklisted tokens model
export interface BlacklistedToken {
  id: number;
  token_jti: string;
  expires_at: Date;
  created_at: Date;
}

export class BlacklistedTokenModel {
  static async addToken(jti: string, expiresAt: Date): Promise<BlacklistedToken> {
    const query = `
      INSERT INTO blacklisted_tokens (token_jti, expires_at)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [jti, expiresAt]);
    return result.rows[0];
  }

  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM blacklisted_tokens 
      WHERE token_jti = $1 AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [jti]);
    return result.rows.length > 0;
  }

  static async deleteExpiredTokens(): Promise<number> {
    const query = `
      DELETE FROM blacklisted_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query);
    return result.rowCount;
  }
}
