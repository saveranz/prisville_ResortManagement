-- ============================================
-- EXPORT: Walk-in Bookings Data
-- Run this on your LOCAL database to export data
-- ============================================

-- Export walk_in_bookings data
SELECT 
  CONCAT(
    'INSERT INTO walk_in_bookings (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at) VALUES (',
    QUOTE(guest_name), ', ',
    QUOTE(room_number), ', ',
    QUOTE(contact_number), ', ',
    number_of_pax, ', ',
    QUOTE(total_amount), ', ',
    QUOTE(down_payment), ', ',
    QUOTE(balance), ', ',
    QUOTE(payment_status), ', ',
    QUOTE(created_at),
    ');'
  ) AS insert_statement
FROM walk_in_bookings
WHERE archived = 0
ORDER BY created_at DESC;

-- Instructions:
-- 1. Run this query on your LOCAL database
-- 2. Copy all the INSERT statements from the results
-- 3. Run those INSERT statements on your PRODUCTION database
