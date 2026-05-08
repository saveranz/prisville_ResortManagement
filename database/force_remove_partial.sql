-- Force remove all non-paid bookings
-- This handles case sensitivity and ensures deletion

DELETE FROM walk_in_bookings 
WHERE room_number = 'TBD' 
   OR payment_status = 'partial'
   OR payment_status = 'Partial'
   OR payment_status = 'unpaid'
   OR payment_status = 'Unpaid'
   OR balance > 0;

-- Commit the transaction
COMMIT;

-- Verify deletion
SELECT COUNT(*) as remaining_partial 
FROM walk_in_bookings 
WHERE payment_status != 'paid';
