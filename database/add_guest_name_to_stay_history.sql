-- Add guest_name column to stay_history table (safe version)
-- This allows storing the actual guest name for both online bookings and walk-ins

-- Check if column exists and add it if it doesn't
SET @dbname = DATABASE();
SET @tablename = 'stay_history';
SET @columnname = 'guest_name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists" AS message;',
  'ALTER TABLE stay_history ADD COLUMN guest_name VARCHAR(255) NULL AFTER user_email;'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create an index for searching by guest name (if not exists)
SET @indexStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = 'idx_guest_name'
  ) > 0,
  'SELECT "Index already exists" AS message;',
  'CREATE INDEX idx_guest_name ON stay_history(guest_name);'
));

PREPARE createIndexIfNotExists FROM @indexStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;
