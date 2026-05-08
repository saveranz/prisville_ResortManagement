-- ============================================
-- PRODUCTION: Clear All Walk-in Data
-- ⚠️ WARNING: This will DELETE all data from these tables!
-- Run this on your PRODUCTION database ONLY
-- ============================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear walk-in room bookings
TRUNCATE TABLE walk_in_bookings;

-- Clear day pass walk-in bookings
TRUNCATE TABLE day_pass_walk_in;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are empty
SELECT 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings
UNION ALL
SELECT 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- ============================================
-- RESULT: Both tables should show 0 records
-- ============================================
