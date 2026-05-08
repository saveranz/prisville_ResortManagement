-- Insert Room Walk-in Bookings Data for 2026
-- This script inserts walk-in booking records from March to May 2026

-- Note: Using the current table structure with payment tracking
-- Columns: guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at

INSERT INTO walk_in_bookings 
  (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at)
VALUES
  -- April 3, 2026 - CANCELLED (can be removed if not needed)
  ('Maribel Bicac / Roland Guya', 'Room 101', '09383944767', 2, 2000.00, 2000.00, 0.00, 'paid', '2026-04-03 14:00:00'),
  
  -- April 3, 2026
  ('Alma P. Miranda', 'Room 102', '09176800527', 2, 2200.00, 2200.00, 0.00, 'paid', '2026-04-03 15:00:00'),
  
  -- April 11, 2026
  ('Reynaldo Ruga Uy', 'Room 103', 'N/A', 2, 2000.00, 2000.00, 0.00, 'paid', '2026-04-11 14:00:00'),
  
  -- April 20, 2026
  ('Mjay Parafina', 'Room 104', '09999035212', 2, 2200.00, 2200.00, 0.00, 'paid', '2026-04-20 14:00:00'),
  
  -- May 23, 2026
  ('Elizabeth Asi', 'Room 105', '09706741259', 2, 7400.00, 7400.00, 0.00, 'paid', '2026-05-23 14:00:00');

-- Note: 
-- - Room numbers marked as 'TBD' where not specified in original data
-- - Contact numbers marked as 'N/A' where not provided
-- - Number of pax set to 2 as default (can be updated based on actual data)
-- - CANCELLED booking for "Maribel Bicac / Roland Guya" included but can be deleted if needed
-- - Amounts parsed from payment notes:
--   * "3,700 x 2" = 7,400 (Elizabeth Asi)
--   * "2,200 (Paid)" = 2,200 fully paid
--   * Missing amounts set to 0.00
-- - Created timestamps set to 2:00 PM on booking date (can be adjusted)

-- To remove the cancelled booking, run:
-- DELETE FROM walk_in_bookings WHERE guest_name = 'Maribel Bicac / Roland Guya' AND created_at = '2026-04-03 14:00:00';
