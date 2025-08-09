-- Migration: Update users table and create categories table
-- Date: 2025-01-08
-- Description: Add user preferences fields and create categories management

-- =====================================================
-- 1. UPDATE USERS TABLE - Add missing fields
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'PEN';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'es';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_reports BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_alerts BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN users.currency IS 'User preferred currency (ISO 4217 code)';
COMMENT ON COLUMN users.language IS 'User preferred language (ISO 639-1 code)';
COMMENT ON COLUMN users.email_notifications IS 'Enable email notifications';
COMMENT ON COLUMN users.push_notifications IS 'Enable push notifications';
COMMENT ON COLUMN users.weekly_reports IS 'Enable weekly financial reports';
COMMENT ON COLUMN users.budget_alerts IS 'Enable budget limit alerts';

-- =====================================================
-- 2. CREATE CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for default categories
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique category names per user and type
    UNIQUE(name, type, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);

-- Add comments
COMMENT ON TABLE categories IS 'User transaction categories (income and expense)';
COMMENT ON COLUMN categories.user_id IS 'NULL for system default categories, user_id for custom categories';
COMMENT ON COLUMN categories.is_default IS 'True for system-provided default categories';

-- =====================================================
-- 3. INSERT DEFAULT CATEGORIES
-- =====================================================

-- Default Income Categories
INSERT INTO categories (name, type, user_id, is_default) VALUES
('Salario', 'income', NULL, true),
('Freelance', 'income', NULL, true),
('Inversiones', 'income', NULL, true),
('Bonos', 'income', NULL, true),
('Otros ingresos', 'income', NULL, true)
ON CONFLICT (name, type, user_id) DO NOTHING;

-- Default Expense Categories
INSERT INTO categories (name, type, user_id, is_default) VALUES
('Vivienda', 'expense', NULL, true),
('Alimentación', 'expense', NULL, true),
('Transporte', 'expense', NULL, true),
('Entretenimiento', 'expense', NULL, true),
('Servicios', 'expense', NULL, true),
('Salud', 'expense', NULL, true),
('Educación', 'expense', NULL, true),
('Compras', 'expense', NULL, true),
('Otros gastos', 'expense', NULL, true)
ON CONFLICT (name, type, user_id) DO NOTHING;

-- =====================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table (if not exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify users table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verify categories table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Count default categories
SELECT type, COUNT(*) as count 
FROM categories 
WHERE is_default = true 
GROUP BY type;
