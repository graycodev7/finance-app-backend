-- Migration: Fix refresh token field length
-- Description: Increase token field size to accommodate longer JWT tokens

-- Increase token field size from VARCHAR(255) to TEXT
ALTER TABLE refresh_tokens ALTER COLUMN token TYPE TEXT;

-- Also increase device_info field size for better compatibility
ALTER TABLE refresh_tokens ALTER COLUMN device_info TYPE TEXT;

-- Update blacklisted_tokens table as well for consistency
ALTER TABLE blacklisted_tokens ALTER COLUMN token_jti TYPE TEXT;

-- Add comment for documentation
COMMENT ON COLUMN refresh_tokens.token IS 'JWT refresh token (increased to TEXT to accommodate longer tokens)';
COMMENT ON COLUMN blacklisted_tokens.token_jti IS 'JWT ID claim (increased to TEXT for consistency)';
