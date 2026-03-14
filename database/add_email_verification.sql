-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255) NULL,
ADD COLUMN verification_token_expires DATETIME NULL,
ADD INDEX idx_verification_token (verification_token);

-- Update existing users to be verified (so they're not locked out)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;
