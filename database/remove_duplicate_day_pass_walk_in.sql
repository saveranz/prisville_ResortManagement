-- Remove duplicate day pass walk-in records
-- This keeps only the oldest record for each unique combination of name, pax, cottage, time, and amount

-- Step 1: Create a temporary table with unique records (keeping the lowest ID for each duplicate group)
CREATE TEMPORARY TABLE temp_unique_records AS
SELECT MIN(id) as id
FROM day_pass_walk_in
GROUP BY representative_name, number_of_pax, cottage_type, time_of_day, total_amount, DATE(created_at);

-- Step 2: Delete all records that are NOT in the unique list
DELETE FROM day_pass_walk_in
WHERE id NOT IN (SELECT id FROM temp_unique_records);

-- Step 3: Drop the temporary table
DROP TEMPORARY TABLE temp_unique_records;

-- Step 4: Verify the results
SELECT COUNT(*) as total_records FROM day_pass_walk_in;
SELECT * FROM day_pass_walk_in ORDER BY created_at DESC;
