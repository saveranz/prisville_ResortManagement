-- IMPORTANT: Run this migration to fix check-in functionality
-- This adds the required columns for guest check-in/check-out
-- NOTE: If you get an error that column already exists, that's OK - just ignore it

-- Add columns (if they already exist, you'll see an error but that's normal)
ALTER TABLE room_bookings 
ADD COLUMN actual_check_in TIMESTAMP NULL AFTER check_out,
ADD COLUMN actual_check_out TIMESTAMP NULL AFTER actual_check_in,
ADD COLUMN room_status VARCHAR(50) DEFAULT 'pending' AFTER actual_check_out;

-- Add indexes for better performance
ALTER TABLE room_bookings 
ADD INDEX idx_actual_check_in (actual_check_in),
ADD INDEX idx_actual_check_out (actual_check_out),
ADD INDEX idx_room_status (room_status);
