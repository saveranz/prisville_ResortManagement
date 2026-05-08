-- Step 1: Add new columns first
ALTER TABLE day_pass_walk_in 
ADD COLUMN cottage_type ENUM('concrete', 'kubo') NULL AFTER number_of_pax;

ALTER TABLE day_pass_walk_in 
ADD COLUMN time_of_day ENUM('day', 'night') NULL AFTER cottage_type;

ALTER TABLE day_pass_walk_in 
ADD COLUMN total_amount DECIMAL(10, 2) NULL AFTER time_of_day;

-- Step 2: Set default values for existing rows (if any)
UPDATE day_pass_walk_in 
SET cottage_type = 'kubo', 
    time_of_day = 'day', 
    total_amount = CAST(amount AS DECIMAL(10,2))
WHERE cottage_type IS NULL;

-- Step 3: Make new columns NOT NULL
ALTER TABLE day_pass_walk_in 
MODIFY COLUMN cottage_type ENUM('concrete', 'kubo') NOT NULL;

ALTER TABLE day_pass_walk_in 
MODIFY COLUMN time_of_day ENUM('day', 'night') NOT NULL;

ALTER TABLE day_pass_walk_in 
MODIFY COLUMN total_amount DECIMAL(10, 2) NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE day_pass_walk_in 
DROP COLUMN cottage;

ALTER TABLE day_pass_walk_in 
DROP COLUMN cottage_number;

ALTER TABLE day_pass_walk_in 
DROP COLUMN amount;
