-- Add password reset token columns to users table
ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires DATETIME NULL,
ADD INDEX idx_reset_token (reset_token);
