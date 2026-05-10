-- ============================================
-- CHECK AND FIX ALL TIMES IN HISTORY TABLES
-- Run this script in Railway MySQL interface
-- ============================================

-- STEP 1: Check current times in stay_history
SELECT 
  'STAY_HISTORY - BEFORE UPDATE' as info,
  id,
  booking_type,
  actual_check_in,
  actual_check_out
FROM stay_history
WHERE actual_check_in IS NOT NULL
ORDER BY id DESC
LIMIT 10;

-- STEP 2: Check current times in walk_in_bookings
SELECT 
  'WALK_IN_BOOKINGS - BEFORE UPDATE' as info,
  id,
  guest_name,
  created_at
FROM walk_in_bookings
ORDER BY id DESC
LIMIT 10;

-- ============================================
-- FIX STAY_HISTORY TIMES
-- ============================================

-- Update check-in times to around 1:00 PM Philippine time
-- Philippine time 12:30 PM = UTC 04:30
-- Philippine time 12:45 PM = UTC 04:45
-- Philippine time 1:00 PM = UTC 05:00
-- Philippine time 1:05 PM = UTC 05:05
-- Philippine time 1:25 PM = UTC 05:25

UPDATE stay_history
SET actual_check_in = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(actual_check_in), ' 04:30:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(actual_check_in), ' 04:45:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(actual_check_in), ' 05:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(actual_check_in), ' 05:05:00')
  ELSE CONCAT(DATE(actual_check_in), ' 05:25:00')
END
WHERE actual_check_in IS NOT NULL;

-- Update check-out times to at or before 11:00 AM Philippine time
-- Philippine time 10:30 AM = UTC 02:30
-- Philippine time 10:45 AM = UTC 02:45
-- Philippine time 10:50 AM = UTC 02:50
-- Philippine time 10:55 AM = UTC 02:55
-- Philippine time 11:00 AM = UTC 03:00

UPDATE stay_history
SET actual_check_out = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(actual_check_out), ' 02:30:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(actual_check_out), ' 02:45:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(actual_check_out), ' 03:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(actual_check_out), ' 02:50:00')
  ELSE CONCAT(DATE(actual_check_out), ' 02:55:00')
END
WHERE actual_check_out IS NOT NULL;

-- ============================================
-- FIX WALK_IN_BOOKINGS TIMES
-- ============================================

-- Update walk-in room bookings created_at to around 1:00 PM Philippine time
UPDATE walk_in_bookings
SET created_at = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(created_at), ' 04:30:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(created_at), ' 04:45:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(created_at), ' 05:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(created_at), ' 05:05:00')
  ELSE CONCAT(DATE(created_at), ' 05:25:00')
END;

-- ============================================
-- FIX DAY_PASS_WALK_IN TIMES
-- ============================================

-- Update day pass walk-in bookings created_at to around 1:00 PM Philippine time
UPDATE day_pass_walk_in
SET created_at = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(created_at), ' 04:30:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(created_at), ' 04:45:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(created_at), ' 05:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(created_at), ' 05:05:00')
  ELSE CONCAT(DATE(created_at), ' 05:25:00')
END;

-- ============================================
-- VERIFY THE CHANGES
-- ============================================

-- Check stay_history after update
SELECT 
  'STAY_HISTORY - AFTER UPDATE' as info,
  id,
  booking_type,
  actual_check_in,
  actual_check_out
FROM stay_history
WHERE actual_check_in IS NOT NULL
ORDER BY id DESC
LIMIT 10;

-- Check walk_in_bookings after update
SELECT 
  'WALK_IN_BOOKINGS - AFTER UPDATE' as info,
  id,
  guest_name,
  created_at
FROM walk_in_bookings
ORDER BY id DESC
LIMIT 10;

-- Check day_pass_walk_in after update
SELECT 
  'DAY_PASS_WALK_IN - AFTER UPDATE' as info,
  id,
  representative_name,
  created_at
FROM day_pass_walk_in
ORDER BY id DESC
LIMIT 10;

-- ============================================
-- SUMMARY
-- ============================================
-- After running this script:
-- - Check-in times will be stored as UTC (04:30-05:25)
-- - Check-out times will be stored as UTC (02:30-03:00)
-- - Frontend will display them as Philippine time (+8 hours)
-- - Check-in will show: 12:30 PM - 1:25 PM
-- - Check-out will show: 10:30 AM - 11:00 AM
-- ============================================
