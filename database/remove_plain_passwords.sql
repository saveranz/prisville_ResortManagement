-- Drop the old sample users with plain text passwords
DELETE FROM users WHERE email IN ('admin@prisville.com', 'receptionist@prisville.com');

-- Note: To create receptionist and admin users, use the API endpoint POST /api/auth/register
-- Then manually update the role in the database:
-- UPDATE users SET role = 'receptionist' WHERE email = 'receptionist@prisville.com';
-- UPDATE users SET role = 'admin' WHERE email = 'admin@prisville.com';
