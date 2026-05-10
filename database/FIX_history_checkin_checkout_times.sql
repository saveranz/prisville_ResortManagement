-- Fix check-in and check-out times in stay_history table
-- Check-in: around 1:00 PM (12:30, 12:45, 1:00, 1:05, 1:25)
-- Check-out: around 11:00 AM (10:45, 10:55, 11:00, 11:05, 11:10)

-- Show current times before update
SELECT 
  id,
  booking_type,
  DATE_FORMAT(actual_check_in, '%Y-%m-%d %H:%i:%s') as check_in_before,
  DATE_FORMAT(actual_check_out, '%Y-%m-%d %H:%i:%s') as check_out_before
FROM stay_history
WHERE actual_check_in IS NOT NULL
LIMIT 10;

-- Update check-in times to be around 1:00 PM (13:00)
UPDATE stay_history
SET actual_check_in = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(actual_check_in), ' 12:30:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(actual_check_in), ' 12:45:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(actual_check_in), ' 13:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(actual_check_in), ' 13:05:00')
  ELSE CONCAT(DATE(actual_check_in), ' 13:25:00')
END
WHERE actual_check_in IS NOT NULL;

-- Update check-out times to be around 11:00 AM
UPDATE stay_history
SET actual_check_out = CASE 
  WHEN MOD(id, 5) = 0 THEN CONCAT(DATE(actual_check_out), ' 10:45:00')
  WHEN MOD(id, 5) = 1 THEN CONCAT(DATE(actual_check_out), ' 10:55:00')
  WHEN MOD(id, 5) = 2 THEN CONCAT(DATE(actual_check_out), ' 11:00:00')
  WHEN MOD(id, 5) = 3 THEN CONCAT(DATE(actual_check_out), ' 11:05:00')
  ELSE CONCAT(DATE(actual_check_out), ' 11:10:00')
END
WHERE actual_check_out IS NOT NULL;

-- Verify the changes
SELECT 
  id,
  booking_type,
  DATE_FORMAT(actual_check_in, '%Y-%m-%d %h:%i %p') as check_in_after,
  DATE_FORMAT(actual_check_out, '%Y-%m-%d %h:%i %p') as check_out_after
FROM stay_history
WHERE actual_check_in IS NOT NULL
ORDER BY id DESC
LIMIT 20;
