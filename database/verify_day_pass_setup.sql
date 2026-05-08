-- Verification script for day pass walk-in setup
-- Run this to check if everything is set up correctly

-- 1. Check if day_pass_walk_in table exists
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'prisville02' 
  AND TABLE_NAME = 'day_pass_walk_in';

-- 2. Check table structure
DESCRIBE day_pass_walk_in;

-- 3. Count records
SELECT COUNT(*) as total_records FROM day_pass_walk_in;

-- 4. Show first 5 records
SELECT * FROM day_pass_walk_in ORDER BY created_at DESC LIMIT 5;

-- 5. Show summary by cottage type
SELECT 
  cottage_type,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM day_pass_walk_in
GROUP BY cottage_type;
