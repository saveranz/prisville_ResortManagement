-- Add status column to users table for account management
ALTER TABLE users ADD COLUMN status ENUM('active', 'locked', 'deleted') DEFAULT 'active' AFTER updated_at;

-- Add index for status queries
ALTER TABLE users ADD INDEX idx_status (status);

-- Update existing records to be active
UPDATE users SET status = 'active' WHERE status IS NULL;
