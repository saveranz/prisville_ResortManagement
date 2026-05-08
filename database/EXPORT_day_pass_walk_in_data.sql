-- ============================================
-- EXPORT: Day Pass Walk-in Data
-- Run this on your LOCAL database to export data
-- ============================================

-- Export day_pass_walk_in data
SELECT 
  CONCAT(
    'INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage, cottage_number, amount, created_at) VALUES (',
    QUOTE(representative_name), ', ',
    number_of_pax, ', ',
    QUOTE(cottage), ', ',
    IFNULL(QUOTE(cottage_number), 'NULL'), ', ',
    QUOTE(amount), ', ',
    QUOTE(created_at),
    ');'
  ) AS insert_statement
FROM day_pass_walk_in
ORDER BY created_at DESC;

-- Instructions:
-- 1. Run this query on your LOCAL database
-- 2. Copy all the INSERT statements from the results
-- 3. Paste them here in the chat so I can create the production script
