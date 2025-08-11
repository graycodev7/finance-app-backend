DROP TABLE IF EXISTS blacklisted_tokens CASCADE;

CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100) DEFAULT 'logout'
);

CREATE INDEX idx_blacklisted_tokens_jti ON blacklisted_tokens(token_jti);
CREATE INDEX idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);
