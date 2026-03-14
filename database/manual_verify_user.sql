-- Manually verify a user account
-- Replace 'your@email.com' with your actual email

UPDATE users 
SET email_verified = TRUE 
WHERE email = 'your@email.com';

-- Or verify all users at once
UPDATE users SET email_verified = TRUE;

-- Check verification status
SELECT email, email_verified, created_at FROM users;
