import pool from '../config/database';

export interface Transaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionData {
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface UpdateTransactionData {
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}

export class TransactionModel {
  static async create(transactionData: CreateTransactionData): Promise<Transaction> {
    const { user_id, type, amount, category, description, date } = transactionData;

    const query = `
      INSERT INTO transactions (user_id, type, amount, category, description, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [user_id, type, amount, category, description, date]);
    return result.rows[0];
  }

  static async findByUserId(userId: number, limit?: number, offset?: number): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC';
    const params: any[] = [userId];

    if (limit) {
      query += ' LIMIT $2';
      params.push(limit);
      
      if (offset) {
        query += ' OFFSET $3';
        params.push(offset);
      }
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id: number, userId: number): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  static async update(id: number, userId: number, updateData: UpdateTransactionData): Promise<Transaction | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE transactions 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  static async getStatsByUserId(userId: number, startDate?: string, endDate?: string) {
    let query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ' GROUP BY type';

    const result = await pool.query(query, params);
    return result.rows;
  }
}
