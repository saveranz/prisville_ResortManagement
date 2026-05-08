-- ============================================
-- PRODUCTION: Clear prisville02 Database
-- ⚠️ WARNING: This will DELETE all walk-in data!
-- ============================================

-- Switch to prisville02 database explicitly
USE prisville02;

-- Confirm which database we're in
SELECT DATABASE() as current_database;

-- Show current counts
SELECT 'walk_in_bookings' as table_name, COUNT(*) as count_before FROM prisville02.walk_in_bookings;
SELECT 'day_pass_walk_in' as table_name, COUNT(*) as count_before FROM prisville02.day_pass_walk_in;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all records using explicit database name
DELETE FROM prisville02.walk_in_bookings;
DELETE FROM prisville02.day_pass_walk_in;

-- Reset auto increment
ALTER TABLE prisville02.walk_in_bookings AUTO_INCREMENT = 1;
ALTER TABLE prisville02.day_pass_walk_in AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show counts after deletion (should be 0)
SELECT 'walk_in_bookings' as table_name, COUNT(*) as count_after FROM prisville02.walk_in_bookings;
SELECT 'day_pass_walk_in' as table_name, COUNT(*) as count_after FROM prisville02.day_pass_walk_in;
