-- Enhance users table with more guest information
ALTER TABLE users 
ADD COLUMN phone VARCHAR(50) AFTER email,
ADD COLUMN address TEXT AFTER name,
ADD COLUMN city VARCHAR(100) AFTER address,
ADD COLUMN country VARCHAR(100) AFTER city,
ADD COLUMN id_type VARCHAR(50) AFTER country,
ADD COLUMN id_number VARCHAR(100) AFTER id_type,
ADD COLUMN emergency_contact_name VARCHAR(255) AFTER id_number,
ADD COLUMN emergency_contact_phone VARCHAR(50) AFTER emergency_contact_name,
ADD COLUMN preferences TEXT AFTER emergency_contact_phone,
ADD COLUMN total_bookings INT DEFAULT 0 AFTER preferences,
ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0.00 AFTER total_bookings;

-- Add indexes
ALTER TABLE users 
ADD INDEX idx_phone (phone),
ADD INDEX idx_city (city);
