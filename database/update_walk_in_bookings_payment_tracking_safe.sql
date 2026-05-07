-- Safe migration for walk_in_bookings table
-- Run this if the previous migration failed

-- Check if columns exist before adding them
SET @dbname = DATABASE();
SET @tablename = 'walk_in_bookings';

-- Add total_amount if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'total_amount');
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE walk_in_bookings ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER amount', 
    'SELECT "Column total_amount already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add down_payment if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'down_payment');
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE walk_in_bookings ADD COLUMN down_payment DECIMAL(10, 2) DEFAULT 0.00 AFTER total_amount', 
    'SELECT "Column down_payment already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add balance if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'balance');
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE walk_in_bookings ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 AFTER down_payment', 
    'SELECT "Column balance already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_status if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'payment_status');
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE walk_in_bookings ADD COLUMN payment_status ENUM(\'partial\', \'paid\') DEFAULT \'partial\' AFTER balance', 
    'SELECT "Column payment_status already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing data
UPDATE walk_in_bookings 
SET 
  total_amount = COALESCE(total_amount, amount, 0),
  down_payment = COALESCE(down_payment, amount, 0),
  balance = COALESCE(balance, 0),
  payment_status = COALESCE(payment_status, 'paid')
WHERE total_amount = 0 OR total_amount IS NULL;

-- Remove address column if it exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'address');
SET @query = IF(@col_exists > 0, 
    'ALTER TABLE walk_in_bookings DROP COLUMN address', 
    'SELECT "Column address does not exist"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' as status;
