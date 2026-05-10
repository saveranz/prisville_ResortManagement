-- Clear test bookings from Room Bookings and Day Pass Bookings
-- Run this on Railway MySQL database

-- Clear room bookings (online reservations)
DELETE FROM room_bookings 
WHERE id IN (1, 2, 3, 4);

-- Clear day pass bookings (online reservations)
DELETE FROM day_pass_bookings 
WHERE id IN (1, 2);

-- Verify deletion
SELECT 'Room Bookings Count:' as info, COUNT(*) as count FROM room_bookings
UNION ALL
SELECT 'Day Pass Bookings Count:' as info, COUNT(*) as count FROM day_pass_bookings;
