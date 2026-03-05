-- Add room_type column to room_bookings table if it doesn't exist
-- Run this script to update existing database

-- Check if column exists and add it if not
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = 'room_bookings'
AND column_name = 'room_type';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE room_bookings ADD COLUMN room_type VARCHAR(50) AFTER room_name',
  'SELECT ''Column room_type already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM information_schema.statistics
WHERE table_schema = DATABASE()
AND table_name = 'room_bookings'
AND index_name = 'idx_room_type';

SET @sql_index = IF(@index_exists = 0,
  'ALTER TABLE room_bookings ADD INDEX idx_room_type (room_type)',
  'SELECT ''Index idx_room_type already exists'' AS message');
PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;
