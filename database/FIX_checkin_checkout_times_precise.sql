-- Fix check-in and check-out times in stay_history table
-- Check-in: Set to 1:00 PM (13:00) with some variation
-- Check-out: Set to 11:00 AM with some variation

-- Update check-in times to be around 1:00 PM
-- Variations: 12:30 PM, 12:45 PM, 1:00 PM, 1:15 PM, 1:30 PM
UPDATE stay_history
SET actual_check_in = CASE 
    WHEN MOD(id, 5) = 0 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '12:30:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 1 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '12:45:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 2 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '13:00:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 3 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '13:15:00' HOUR_SECOND)
    ELSE DATE_ADD(DATE(actual_check_in), INTERVAL '13:30:00' HOUR_SECOND)
END
WHERE actual_check_in IS NOT NULL;

-- Update check-out times to be around 11:00 AM
-- Variations: 10:45 AM, 10:55 AM, 11:00 AM, 11:05 AM, 11:10 AM
UPDATE stay_history
SET actual_check_out = CASE 
    WHEN MOD(id, 5) = 0 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '10:45:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 1 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '10:55:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 2 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '11:00:00' HOUR_SECOND)
    WHEN MOD(id, 5) = 3 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '11:05:00' HOUR_SECOND)
    ELSE DATE_ADD(DATE(actual_check_out), INTERVAL '11:10:00' HOUR_SECOND)
END
WHERE actual_check_out IS NOT NULL;

-- Verify the changes
SELECT 
    id,
    guest_name,
    booking_type,
    room_numbers,
    DATE_FORMAT(actual_check_in, '%Y-%m-%d %h:%i %p') as check_in_time,
    DATE_FORMAT(actual_check_out, '%Y-%m-%d %h:%i %p') as check_out_time,
    nights_stayed
FROM stay_history
WHERE booking_type = 'room'
ORDER BY actual_check_in DESC
LIMIT 20;
