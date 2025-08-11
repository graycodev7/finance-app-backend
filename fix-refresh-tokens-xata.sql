-- Fix refresh_tokens table in Xata PostgreSQL (Simplified - No Functions/Triggers)
-- Xata doesn't support CREATE FUNCTION or complex triggers

-- Drop table if exists and recreate with correct schema
DROP TABLE IF EXISTS refresh_tokens CASCADE;

-- Create refresh_tokens table with all required columns
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    device_info TEXT,
    ip_address VARCHAR(45)
);

-- Create indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
