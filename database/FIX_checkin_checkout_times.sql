-- Fix check-in and check-out times in stay_history table
-- Check-in should be around 1:00 PM (13:00) or before
-- Check-out should be around 11:00 AM or slightly before/after

-- Update check-in times to be between 12:00 PM and 2:00 PM
UPDATE stay_history
SET actual_check_in = DATE_FORMAT(
    DATE_ADD(
        DATE(actual_check_in),
        INTERVAL (12 + FLOOR(RAND() * 3)) HOUR
    ),
    '%Y-%m-%d %H:%i:%s'
)
WHERE actual_check_in IS NOT NULL;

-- Update check-out times to be between 10:30 AM and 11:30 AM
UPDATE stay_history
SET actual_check_out = DATE_FORMAT(
    DATE_ADD(
        DATE(actual_check_out),
        INTERVAL (10 + FLOOR(RAND() * 2)) HOUR
    ),
    '%Y-%m-%d %H:%i:%s'
)
WHERE actual_check_out IS NOT NULL;

-- Verify the changes
SELECT 
    id,
    guest_name,
    booking_type,
    DATE_FORMAT(actual_check_in, '%Y-%m-%d %H:%i') as check_in_time,
    DATE_FORMAT(actual_check_out, '%Y-%m-%d %H:%i') as check_out_time
FROM stay_history
ORDER BY actual_check_in DESC
LIMIT 20;
