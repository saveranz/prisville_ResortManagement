-- ============================================
-- PRODUCTION: Insert walk-in bookings with address field
-- Run this on your PRODUCTION database
-- ============================================

-- Insert walk-in bookings data (with address field in correct position)
INSERT INTO walk_in_bookings (guest_name, room_number, address, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at) VALUES 
('Reynaldo Ruga Uy', 'Room 103', 'N/A', 'N/A', 2, '2000.00', '2000.00', '0.00', 'paid', '2026-04-11 06:00:00'),
('Mjay Parafina', 'Room 105', 'N/A', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-20 06:00:00'),
('Mjay Parafina', 'Room 104', 'N/A', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-20 06:00:00'),
('Maribel Bicac / Roland Guya', 'Room 101', 'N/A', '09383944767', 2, '2000.00', '2000.00', '0.00', 'paid', '2026-04-03 06:00:00'),
('Elizabeth Asi', 'Room 106', 'N/A', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', '2026-05-23 06:00:00'),
('Elizabeth Asi', 'Room 105', 'N/A', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', '2026-05-23 06:00:00'),
('Alma P. Miranda', 'Room 103', 'N/A', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-03 07:00:00'),
('Alma P. Miranda', 'Room 102', 'N/A', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-03 07:00:00');

-- Verify the data was inserted
SELECT COUNT(*) as total_inserted FROM walk_in_bookings;

-- Show the inserted records
SELECT * FROM walk_in_bookings ORDER BY created_at DESC;
