-- Diagnostic query to check the actual payment_status values
-- This will help identify why the DELETE didn't work

SELECT 
  id,
  guest_name,
  room_number,
  payment_status,
  CHAR_LENGTH(payment_status) as status_length,
  HEX(payment_status) as status_hex,
  down_payment,
  balance,
  total_amount
FROM walk_in_bookings
WHERE payment_status != 'paid'
ORDER BY created_at DESC;

-- Also check the ENUM definition
SHOW COLUMNS FROM walk_in_bookings LIKE 'payment_status';
