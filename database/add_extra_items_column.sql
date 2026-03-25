-- Add extra_items column to room_bookings table
-- This column stores additional items requested by guests (extra bed, towels, etc.)
-- Stored as JSON for easy querying and display

ALTER TABLE room_bookings 
ADD COLUMN extra_items JSON NULL AFTER special_requests;

-- To check if column was added:
-- SHOW COLUMNS FROM room_bookings LIKE 'extra_items';
