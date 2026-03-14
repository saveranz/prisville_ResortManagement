-- Create pending_users table for email verification before account creation
-- Users are stored here temporarily until they verify their email
-- Once verified, they are moved to the main users table

CREATE TABLE IF NOT EXISTS pending_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) NOT NULL,
  verification_token_expires DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verification_token (verification_token),
  INDEX idx_email (email),
  INDEX idx_expires (verification_token_expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up expired pending registrations (optional, run periodically)
-- DELETE FROM pending_users WHERE verification_token_expires < NOW();
