-- ============================================
-- RAILWAY PRODUCTION: Insert Real Walk-in Data
-- Run this AFTER clearing the Railway database
-- ============================================

-- ============================================
-- PART 1: Walk-in Room Bookings (8 records)
-- ============================================

INSERT INTO walk_in_bookings (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, archived, created_at) VALUES 
('Maribel Bicac / Roland Guya', 'Room 101', '09383944767', 2, '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-03 06:00:00'),
('Alma P. Miranda', 'Room 102', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-03 07:00:00'),
('Alma P. Miranda', 'Room 103', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-03 07:00:00'),
('Reynaldo Ruga Uy', 'Room 103', 'N/A', 2, '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-11 06:00:00'),
('Mjay Parafina', 'Room 104', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-20 06:00:00'),
('Mjay Parafina', 'Room 105', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-20 06:00:00'),
('Elizabeth Asi', 'Room 105', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', 0, '2026-05-23 06:00:00'),
('Elizabeth Asi', 'Room 106', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', 0, '2026-05-23 06:00:00');

-- ============================================
-- PART 2: Day Pass Walk-ins (24 records)
-- ============================================

INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) VALUES 
('Judith', 22, 'kubo', 'day', '600.00', '2026-04-01 16:00:00'),
('Francis Bryan L. Aligata', 9, 'kubo', 'day', '400.00', '2026-04-02 16:00:00'),
('Ronilo Seco', 9, 'concrete', 'day', '400.00', '2026-04-03 16:00:00'),
('Kier', 17, 'concrete', 'day', '500.00', '2026-04-04 16:00:00'),
('Gabriel Princes D. Rosas', 13, 'concrete', 'day', '500.00', '2026-04-05 16:00:00'),
('Dane Urbano', 16, 'kubo', 'day', '500.00', '2026-04-06 16:00:00'),
('Eli Doce', 8, 'concrete', 'day', '400.00', '2026-04-08 16:00:00'),
('Mary Rose Arellano', 14, 'kubo', 'day', '500.00', '2026-04-09 16:00:00'),
('Mary Ann M. Jalac', 16, 'kubo', 'day', '500.00', '2026-04-10 16:00:00'),
('Andrea', 7, 'concrete', 'day', '400.00', '2026-04-11 16:00:00'),
('Anthony', 8, 'concrete', 'day', '500.00', '2026-04-12 16:00:00'),
('Dianne', 19, 'kubo', 'day', '500.00', '2026-04-13 16:00:00'),
('Queenie', 9, 'concrete', 'day', '500.00', '2026-04-14 16:00:00'),
('Jessica', 15, 'concrete', 'day', '500.00', '2026-04-16 16:00:00'),
('Jelo', 12, 'kubo', 'day', '500.00', '2026-04-19 16:00:00'),
('Nonato M. Sarmiento', 10, 'kubo', 'day', '500.00', '2026-04-22 16:00:00'),
('Khim', 7, 'kubo', 'day', '500.00', '2026-04-23 16:00:00'),
('Jhackielyn Libres', 12, 'kubo', 'day', '500.00', '2026-04-25 16:00:00'),
('Princess', 13, 'concrete', 'day', '400.00', '2026-04-26 16:00:00'),
('Diane', 14, 'kubo', 'day', '100.00', '2026-04-27 16:00:00'),
('Jian', 9, 'kubo', 'day', '500.00', '2026-04-28 16:00:00'),
('Mary Grace Manalo', 10, 'kubo', 'day', '1000.00', '2026-05-01 16:00:00'),
('Eloisa Villanueva', 15, 'concrete', 'day', '2550.00', '2026-05-02 16:00:00'),
('Lorena Famerial', 12, 'concrete', 'day', '400.00', '2026-05-03 16:00:00');

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the data was inserted
SELECT 'walk_in_bookings' as table_name, COUNT(*) as record_count FROM walk_in_bookings WHERE archived = 0
UNION ALL
SELECT 'day_pass_walk_in' as table_name, COUNT(*) as record_count FROM day_pass_walk_in;

-- Show sample records
SELECT * FROM walk_in_bookings WHERE archived = 0 ORDER BY created_at DESC LIMIT 5;
SELECT * FROM day_pass_walk_in ORDER BY created_at DESC LIMIT 5;

-- ============================================
-- EXPECTED RESULTS:
-- - walk_in_bookings: 8 records
-- - day_pass_walk_in: 24 records
-- ============================================
