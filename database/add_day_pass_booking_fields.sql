-- Add representative_name, cottage_type, and time_of_day to day_pass_bookings table
ALTER TABLE day_pass_bookings
ADD COLUMN representative_name VARCHAR(255) NULL AFTER user_email,
ADD COLUMN cottage_type ENUM('concrete', 'kubo') NULL AFTER contact_number,
ADD COLUMN time_of_day ENUM('day', 'night') NULL AFTER cottage_type;
