import pool from '../config/database';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  user_id: number | null; // null for default categories
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  user_id?: number; // optional for default categories
}

export class CategoryModel {
  // Get all categories for a user (includes default + user custom categories)
  static async getByUserId(userId: number): Promise<Category[]> {
    const query = `
      SELECT * FROM categories 
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY is_default DESC, type, name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get categories by type for a user
  static async getByUserIdAndType(userId: number, type: 'income' | 'expense'): Promise<Category[]> {
    const query = `
      SELECT * FROM categories 
      WHERE (user_id IS NULL OR user_id = $1) AND type = $2
      ORDER BY is_default DESC, name
    `;
    const result = await pool.query(query, [userId, type]);
    return result.rows;
  }

  // Get all default categories
  static async getDefaults(): Promise<Category[]> {
    const query = `
      SELECT * FROM categories 
      WHERE is_default = true
      ORDER BY type, name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Create a new custom category for a user
  static async create(categoryData: CreateCategoryData): Promise<Category> {
    const { name, type, user_id } = categoryData;
    
    const query = `
      INSERT INTO categories (name, type, user_id, is_default)
      VALUES ($1, $2, $3, false)
      RETURNING id, name, type, user_id, is_default, created_at, updated_at
    `;

    const result = await pool.query(query, [name, type, user_id || null]);
    return result.rows[0];
  }

  // Update a custom category (only user-created categories can be updated)
  static async update(id: number, userId: number, updates: Partial<Pick<Category, 'name'>>): Promise<Category | null> {
    const { name } = updates;
    
    const query = `
      UPDATE categories 
      SET name = COALESCE($1, name), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3 AND is_default = false
      RETURNING id, name, type, user_id, is_default, created_at, updated_at
    `;

    const result = await pool.query(query, [name, id, userId]);
    return result.rows[0] || null;
  }

  // Delete a custom category (only user-created categories can be deleted)
  static async delete(id: number, userId: number): Promise<boolean> {
    const query = `
      DELETE FROM categories 
      WHERE id = $1 AND user_id = $2 AND is_default = false
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  // Find category by ID
  static async findById(id: number): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Check if category name exists for user and type
  static async existsByNameAndType(name: string, type: 'income' | 'expense', userId?: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM categories 
      WHERE name = $1 AND type = $2 AND (user_id IS NULL OR user_id = $3)
      LIMIT 1
    `;
    const result = await pool.query(query, [name, type, userId || null]);
    return result.rows.length > 0;
  }
}
