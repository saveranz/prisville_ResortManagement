-- ============================================
-- PRODUCTION: Force Clear All Walk-in Data
-- ⚠️ WARNING: This will DELETE all data!
-- Make sure you're connected to PRODUCTION database
-- ============================================

-- Show current database name to confirm you're in the right place
SELECT DATABASE() as current_database;

-- Show current record counts BEFORE deletion
SELECT 'BEFORE DELETION' as status, 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings
UNION ALL
SELECT 'BEFORE DELETION' as status, 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all records from walk_in_bookings
DELETE FROM walk_in_bookings;

-- Delete all records from day_pass_walk_in
DELETE FROM day_pass_walk_in;

-- Reset auto increment counters
ALTER TABLE walk_in_bookings AUTO_INCREMENT = 1;
ALTER TABLE day_pass_walk_in AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show record counts AFTER deletion
SELECT 'AFTER DELETION' as status, 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings
UNION ALL
SELECT 'AFTER DELETION' as status, 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- ============================================
-- RESULT: Both tables should show 0 records after deletion
-- ============================================
