-- Fix check-in and check-out times in stay_history table
-- Check-in: around 1:00 PM Philippine time (12:30, 12:45, 1:00, 1:05, 1:25)
-- Check-out: around 11:00 AM Philippine time (10:45, 10:55, 11:00, 11:05, 11:10)
-- Note: Database stores in UTC, so we subtract 8 hours from Philippine time

-- Show current times before update (in Philippine time)
SELECT 
  id,
  booking_type,
  CONVERT_TZ(actual_check_in, '+00:00', '+08:00') as check_in_before_ph,
  CONVERT_TZ(actual_check_out, '+00:00', '+08:00') as check_out_before_ph
FROM stay_history
WHERE actual_check_in IS NOT NULL
LIMIT 10;

-- Update check-in times to be around 1:00 PM Philippine time
-- Store as UTC by subtracting 8 hours
UPDATE stay_history
SET actual_check_in = CASE 
  WHEN MOD(id, 5) = 0 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 12:30:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 1 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 12:45:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 2 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:00:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 3 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:05:00'), INTERVAL 8 HOUR)
  ELSE DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:25:00'), INTERVAL 8 HOUR)
END
WHERE actual_check_in IS NOT NULL;

-- Update check-out times to be around 11:00 AM Philippine time
UPDATE stay_history
SET actual_check_out = CASE 
  WHEN MOD(id, 5) = 0 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 10:45:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 1 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 10:55:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 2 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:00:00'), INTERVAL 8 HOUR)
  WHEN MOD(id, 5) = 3 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:05:00'), INTERVAL 8 HOUR)
  ELSE DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:10:00'), INTERVAL 8 HOUR)
END
WHERE actual_check_out IS NOT NULL;

-- Verify the changes (displayed in Philippine time)
SELECT 
  id,
  booking_type,
  CONVERT_TZ(actual_check_in, '+00:00', '+08:00') as check_in_after_ph,
  CONVERT_TZ(actual_check_out, '+00:00', '+08:00') as check_out_after_ph
FROM stay_history
WHERE actual_check_in IS NOT NULL
ORDER BY id DESC
LIMIT 20;
