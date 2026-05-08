-- Update day_pass_walk_in table structure for new pricing logic
-- This migration updates the table to support cottage type and time-based pricing

-- Drop old columns if they exist
ALTER TABLE day_pass_walk_in 
DROP COLUMN IF EXISTS cottage,
DROP COLUMN IF EXISTS cottage_number,
DROP COLUMN IF EXISTS amount;

-- Add new columns
ALTER TABLE day_pass_walk_in 
ADD COLUMN IF NOT EXISTS cottage_type ENUM('concrete', 'kubo') NOT NULL AFTER number_of_pax,
ADD COLUMN IF NOT EXISTS time_of_day ENUM('day', 'night') NOT NULL AFTER cottage_type,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) NOT NULL AFTER time_of_day;

-- Pricing Logic Reference:
-- DAY:
--   Concrete: 500 + (100 * number_of_pax)
--   Kubo: 100 * number_of_pax
-- NIGHT:
--   Concrete: 600 + (150 * number_of_pax)
--   Kubo: 150 * number_of_pax
