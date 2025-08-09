import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  currency: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_reports: boolean;
  budget_alerts: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  currency?: string;
  language?: string;
}

export interface UpdateUserPreferences {
  currency?: string;
  language?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  weekly_reports?: boolean;
  budget_alerts?: boolean;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, name, password, currency = 'PEN', language = 'es' } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, name, password_hash, currency, language)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, password_hash, currency, language, 
                email_notifications, push_notifications, weekly_reports, 
                budget_alerts, created_at, updated_at
    `;

    const result = await pool.query(query, [email, name, hashedPassword, currency, language]);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updatePreferences(userId: number, preferences: UpdateUserPreferences): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic query based on provided preferences
    Object.entries(preferences).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(userId);
    }

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, name, password_hash, currency, language, 
                email_notifications, push_notifications, weekly_reports, 
                budget_alerts, created_at, updated_at
    `;

    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async updateProfile(userId: number, profileData: { name?: string; email?: string }): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic query based on provided profile data
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value.trim() !== '') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value.trim());
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(userId);
    }

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, name, password_hash, currency, language, 
                email_notifications, push_notifications, weekly_reports, 
                budget_alerts, created_at, updated_at
    `;

    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
