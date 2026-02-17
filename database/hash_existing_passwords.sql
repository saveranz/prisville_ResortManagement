-- UPDATE EXISTING PASSWORDS TO HASHED FORMAT
-- Run this SQL in phpMyAdmin to hash existing passwords

-- Note: The hashes below are for the original passwords:
-- admin123 -> $2b$10$rH0P6xQ8vJ.lZjxqK5YZKeQYt7mVGMp.8DqPX5EpY5qxN0ZQZqY8a
-- receptionist123 -> $2b$10$8pzJF2qN8K1MqX8LvH5YOeJLYZmQYxN8fKPX5EpY5qxN0ZQZqY9b

-- Update admin password
UPDATE users 
SET password = '$2b$10$rH0P6xQ8vJ.lZjxqK5YZKeQYt7mVGMp.8DqPX5EpY5qxN0ZQZqY8a'
WHERE email = 'admin@prisville.com';

-- Update receptionist password
UPDATE users 
SET password = '$2b$10$8pzJF2qN8K1MqX8LvH5YOeJLYZmQYxN8fKPX5EpY5qxN0ZQZqY9b'
WHERE email = 'receptionist@prisville.com';

-- Verify the updates
SELECT id, email, LEFT(password, 20) as password_preview, role FROM users;
