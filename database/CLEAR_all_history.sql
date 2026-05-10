-- ============================================
-- CLEAR ALL HISTORY
-- This will delete ALL history records
-- Run this script in Railway MySQL interface
-- ============================================

-- STEP 1: Check what will be deleted
SELECT 'STAY_HISTORY RECORDS' as table_name, COUNT(*) as count FROM stay_history;
SELECT 'WALK_IN_BOOKINGS RECORDS' as table_name, COUNT(*) as count FROM walk_in_bookings;
SELECT 'DAY_PASS_WALK_IN RECORDS' as table_name, COUNT(*) as count FROM day_pass_walk_in;

-- STEP 2: Delete all records from stay_history
DELETE FROM stay_history;

-- STEP 3: Delete all records from walk_in_bookings
DELETE FROM walk_in_bookings;

-- STEP 4: Delete all records from day_pass_walk_in
DELETE FROM day_pass_walk_in;

-- STEP 5: Verify all tables are empty
SELECT 'STAY_HISTORY REMAINING' as table_name, COUNT(*) as count FROM stay_history;
SELECT 'WALK_IN_BOOKINGS REMAINING' as table_name, COUNT(*) as count FROM walk_in_bookings;
SELECT 'DAY_PASS_WALK_IN REMAINING' as table_name, COUNT(*) as count FROM day_pass_walk_in;

-- ============================================
-- SUMMARY
-- ============================================
-- This script deletes ALL history records from:
-- - stay_history (room bookings, amenity bookings, day pass bookings)
-- - walk_in_bookings (walk-in room bookings)
-- - day_pass_walk_in (day pass walk-in bookings)
-- 
-- After running this script, the history section will be empty.
-- ============================================
