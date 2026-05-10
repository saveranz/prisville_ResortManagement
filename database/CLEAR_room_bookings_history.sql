-- ============================================
-- CLEAR ROOM BOOKINGS HISTORY
-- This will delete all room booking records from stay_history
-- Run this script in Railway MySQL interface
-- ============================================

-- STEP 1: Check what will be deleted
SELECT 
  'RECORDS TO BE DELETED' as info,
  COUNT(*) as total_records
FROM stay_history
WHERE booking_type = 'room';

-- Show the records that will be deleted
SELECT 
  id,
  user_email,
  booking_type,
  actual_check_in,
  actual_check_out,
  total_spent
FROM stay_history
WHERE booking_type = 'room'
ORDER BY id DESC;

-- STEP 2: Delete all room booking records from stay_history
DELETE FROM stay_history
WHERE booking_type = 'room';

-- STEP 3: Verify deletion
SELECT 
  'REMAINING RECORDS' as info,
  COUNT(*) as total_records
FROM stay_history;

-- Show remaining records (should only be amenity and day_pass bookings if any)
SELECT 
  id,
  user_email,
  booking_type,
  actual_check_in,
  actual_check_out
FROM stay_history
ORDER BY id DESC
LIMIT 10;

-- ============================================
-- SUMMARY
-- ============================================
-- This script deletes:
-- - All room booking records from stay_history table
-- 
-- This does NOT delete:
-- - Walk-in room bookings (in walk_in_bookings table)
-- - Day pass walk-ins (in day_pass_walk_in table)
-- - Amenity bookings (in stay_history with booking_type = 'amenity')
-- - Day pass bookings (in stay_history with booking_type = 'day_pass')
-- 
-- If you want to delete walk-ins too, run:
-- DELETE FROM walk_in_bookings;
-- DELETE FROM day_pass_walk_in;
-- ============================================
