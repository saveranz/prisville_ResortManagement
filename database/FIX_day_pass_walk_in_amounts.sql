-- ============================================
-- FIX DAY PASS WALK-IN AMOUNTS
-- Recalculate total_amount based on correct pricing:
-- Day: ₱500 cottage + ₱100 per pax
-- Night: ₱600 cottage + ₱150 per pax
-- ============================================

-- STEP 1: Check current amounts (BEFORE)
SELECT 
  'BEFORE UPDATE' as status,
  id,
  representative_name,
  number_of_pax,
  cottage_type,
  time_of_day,
  total_amount as current_amount,
  CASE 
    WHEN time_of_day = 'day' THEN 500 + (100 * number_of_pax)
    WHEN time_of_day = 'night' THEN 600 + (150 * number_of_pax)
    ELSE 0
  END as correct_amount
FROM day_pass_walk_in
ORDER BY id;

-- STEP 2: Update all amounts with correct calculation
UPDATE day_pass_walk_in
SET total_amount = CASE 
  WHEN time_of_day = 'day' THEN 500 + (100 * number_of_pax)
  WHEN time_of_day = 'night' THEN 600 + (150 * number_of_pax)
  ELSE total_amount
END;

-- STEP 3: Verify the changes (AFTER)
SELECT 
  'AFTER UPDATE' as status,
  id,
  representative_name,
  number_of_pax,
  cottage_type,
  time_of_day,
  total_amount as updated_amount,
  CASE 
    WHEN time_of_day = 'day' THEN CONCAT('₱', FORMAT(500 + (100 * number_of_pax), 2))
    WHEN time_of_day = 'night' THEN CONCAT('₱', FORMAT(600 + (150 * number_of_pax), 2))
    ELSE 'N/A'
  END as formatted_amount
FROM day_pass_walk_in
ORDER BY id;

-- ============================================
-- EXAMPLES OF CORRECT CALCULATIONS:
-- ============================================
-- Day pass (day time):
--   12 pax: ₱500 + (12 × ₱100) = ₱1,700
--   15 pax: ₱500 + (15 × ₱100) = ₱2,000
--   10 pax: ₱500 + (10 × ₱100) = ₱1,500
--
-- Day pass (night time):
--   12 pax: ₱600 + (12 × ₱150) = ₱2,400
--   15 pax: ₱600 + (15 × ₱150) = ₱2,850
--   10 pax: ₱600 + (10 × ₱150) = ₱2,100
-- ============================================
