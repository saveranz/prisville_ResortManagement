-- ============================================
-- MIGRATE: Walk-in Bookings to Production
-- This script copies data directly from local to production
-- ============================================

-- OPTION 1: If you have access to both databases simultaneously
-- Replace 'local_db' with your actual local database name
INSERT INTO walk_in_bookings (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at)
SELECT guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at
FROM local_db.walk_in_bookings
WHERE archived = 0;

-- ============================================
-- OPTION 2: Manual INSERT statements
-- Replace these with your actual data
-- ============================================

-- Example format (you need to fill in your actual data):
-- INSERT INTO walk_in_bookings (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at) 
-- VALUES ('Guest Name', '101', '09123456789', 2, '5000.00', '2000.00', '3000.00', 'partial', '2026-05-01 10:30:00');

-- Add your 7 INSERT statements here after running EXPORT_walk_in_data.sql
-- and copying the results from your database tool

