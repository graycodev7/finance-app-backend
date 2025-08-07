import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, name, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, password_hash, created_at, updated_at
    `;

    const result = await pool.query(query, [email, name, hashedPassword]);
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

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
