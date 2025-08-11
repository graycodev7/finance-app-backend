-- Create blacklisted_tokens table in Xata PostgreSQL
-- This table stores revoked/blacklisted JWT tokens for security

-- Drop table if exists and recreate with correct schema
DROP TABLE IF EXISTS blacklisted_tokens CASCADE;

-- Create blacklisted_tokens table
CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100) DEFAULT 'logout'
);

-- Create indexes for performance
CREATE INDEX idx_blacklisted_tokens_jti ON blacklisted_tokens(token_jti);
CREATE INDEX idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);

-- Optional: Add cleanup for expired tokens (manual cleanup since Xata doesn't support scheduled jobs)
-- DELETE FROM blacklisted_tokens WHERE expires_at < CURRENT_TIMESTAMP;
