-- Update existing stay history records with guest names from walk_in_bookings
-- This script matches stay history records to walk-in bookings and populates the guest_name field

-- Update based on matching room number and check-in date
UPDATE stay_history sh
INNER JOIN walk_in_bookings wb ON 
  sh.room_name = wb.room_number 
  AND DATE(sh.actual_check_in) = DATE(wb.created_at)
SET sh.guest_name = wb.guest_name
WHERE sh.user_email = 'walkin@prisville.com' 
  AND (sh.guest_name IS NULL OR sh.guest_name = '');

-- Verify the updates
SELECT 
  sh.id,
  sh.guest_name,
  sh.user_email,
  sh.room_name,
  sh.actual_check_in,
  sh.actual_check_out,
  CONCAT('₱', FORMAT(sh.total_spent, 2)) as total_spent
FROM stay_history sh
WHERE sh.user_email = 'walkin@prisville.com'
ORDER BY sh.actual_check_in DESC;
