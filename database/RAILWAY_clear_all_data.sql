-- ============================================
-- RAILWAY PRODUCTION: Clear All Walk-in Data
-- ⚠️ WARNING: This will DELETE all data from Railway database!
-- Run this on your RAILWAY MySQL database
-- ============================================

-- Confirm we're in the railway database
SELECT DATABASE() as current_database;

-- Show current counts BEFORE deletion
SELECT 'BEFORE' as status, 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings
UNION ALL
SELECT 'BEFORE' as status, 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all records
DELETE FROM walk_in_bookings;
DELETE FROM day_pass_walk_in;

-- Reset auto increment counters
ALTER TABLE walk_in_bookings AUTO_INCREMENT = 1;
ALTER TABLE day_pass_walk_in AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show counts AFTER deletion (should be 0)
SELECT 'AFTER' as status, 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings
UNION ALL
SELECT 'AFTER' as status, 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- ============================================
-- RESULT: Both tables should show 0 records after deletion
-- ============================================
