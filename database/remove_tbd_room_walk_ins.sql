-- Remove walk-in bookings with TBD room numbers or partial payment status
-- This removes duplicate entries that were created before room numbers were assigned
-- and entries with partial payment status

DELETE FROM walk_in_bookings 
WHERE room_number = 'TBD' OR payment_status = 'partial';
