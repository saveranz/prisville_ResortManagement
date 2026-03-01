-- Add actual check-in and check-out timestamps to room_bookings table
ALTER TABLE room_bookings 
ADD COLUMN actual_check_in TIMESTAMP NULL AFTER check_out,
ADD COLUMN actual_check_out TIMESTAMP NULL AFTER actual_check_in,
ADD COLUMN room_status VARCHAR(50) DEFAULT 'pending' AFTER actual_check_out;

-- Add indexes for better performance
ALTER TABLE room_bookings 
ADD INDEX idx_actual_check_in (actual_check_in),
ADD INDEX idx_actual_check_out (actual_check_out),
ADD INDEX idx_room_status (room_status);
