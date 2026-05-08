-- Verification script for day_pass_walk_in table
-- Run these queries one by one to diagnose the issue

-- 1. Check if table exists and see its structure
DESCRIBE day_pass_walk_in;

-- 2. Count total records in the table
SELECT COUNT(*) as total_records FROM day_pass_walk_in;

-- 3. View all records (if any)
SELECT * FROM day_pass_walk_in ORDER BY created_at DESC;

-- 4. Check the table structure matches what we expect
SHOW CREATE TABLE day_pass_walk_in;
