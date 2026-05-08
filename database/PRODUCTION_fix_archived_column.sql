-- ============================================
-- FIX: Add archived column to walk_in_bookings
-- Run this on your PRODUCTION database
-- ============================================

-- Check current table structure
DESCRIBE walk_in_bookings;

-- Add archived column (using standard ALTER TABLE without IF NOT EXISTS)
ALTER TABLE walk_in_bookings 
ADD COLUMN archived TINYINT(1) DEFAULT 0;

-- Verify the column was added
DESCRIBE walk_in_bookings;

-- Now you can run the data insert
