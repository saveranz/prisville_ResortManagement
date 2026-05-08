-- ============================================
-- PRODUCTION: Insert walk-in bookings (simple format)
-- This matches the actual production table structure
-- ============================================

-- Insert walk-in bookings data (simplified to match production structure)
INSERT INTO walk_in_bookings (guest_name, room_number, address, contact_number, number_of_pax, amount, created_at) VALUES 
('Reynaldo Ruga Uy', 'Room 103', 'N/A', 'N/A', 2, 2000.00, '2026-04-11 06:00:00'),
('Mjay Parafina', 'Room 105', 'N/A', '09999035212', 2, 2200.00, '2026-04-20 06:00:00'),
('Mjay Parafina', 'Room 104', 'N/A', '09999035212', 2, 2200.00, '2026-04-20 06:00:00'),
('Maribel Bicac / Roland Guya', 'Room 101', 'N/A', '09383944767', 2, 2000.00, '2026-04-03 06:00:00'),
('Elizabeth Asi', 'Room 106', 'N/A', '09706741259', 2, 7400.00, '2026-05-23 06:00:00'),
('Elizabeth Asi', 'Room 105', 'N/A', '09706741259', 2, 7400.00, '2026-05-23 06:00:00'),
('Alma P. Miranda', 'Room 103', 'N/A', '09176800527', 2, 2200.00, '2026-04-03 07:00:00'),
('Alma P. Miranda', 'Room 102', 'N/A', '09176800527', 2, 2200.00, '2026-04-03 07:00:00');

-- Verify the data was inserted
SELECT * FROM walk_in_bookings ORDER BY created_at DESC;
