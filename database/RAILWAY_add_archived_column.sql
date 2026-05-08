-- ============================================
-- RAILWAY: Add archived column to walk_in_bookings
-- Run this BEFORE inserting data
-- ============================================

-- Add archived column if it doesn't exist
ALTER TABLE walk_in_bookings 
ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;

-- Verify the column was added
DESCRIBE walk_in_bookings;

-- Set all existing records to archived = 0
UPDATE walk_in_bookings SET archived = 0 WHERE archived IS NULL;
