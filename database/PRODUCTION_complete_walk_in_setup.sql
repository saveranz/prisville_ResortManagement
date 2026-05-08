-- ============================================
-- PRODUCTION COMPLETE SETUP: Walk-in Bookings
-- Run this ENTIRE script on your PRODUCTION database
-- ============================================

-- STEP 1: Add archived column to walk_in_bookings table
ALTER TABLE walk_in_bookings 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_walk_in_archived ON walk_in_bookings(archived);

-- STEP 2: Insert walk-in bookings data
INSERT INTO walk_in_bookings (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status, created_at) VALUES 
('Reynaldo Ruga Uy', 'Room 103', 'N/A', 2, '2000.00', '2000.00', '0.00', 'paid', '2026-04-11 06:00:00'),
('Mjay Parafina', 'Room 105', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-20 06:00:00'),
('Mjay Parafina', 'Room 104', '09999035212', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-20 06:00:00'),
('Maribel Bicac / Roland Guya', 'Room 101', '09383944767', 2, '2000.00', '2000.00', '0.00', 'paid', '2026-04-03 06:00:00'),
('Elizabeth Asi', 'Room 106', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', '2026-05-23 06:00:00'),
('Elizabeth Asi', 'Room 105', '09706741259', 2, '7400.00', '7400.00', '0.00', 'paid', '2026-05-23 06:00:00'),
('Alma P. Miranda', 'Room 103', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-03 07:00:00'),
('Alma P. Miranda', 'Room 102', '09176800527', 2, '2200.00', '2200.00', '0.00', 'paid', '2026-04-03 07:00:00');

-- STEP 3: Verify the data was inserted
SELECT COUNT(*) as total_inserted FROM walk_in_bookings WHERE archived = 0;

-- STEP 4: Show the inserted records
SELECT * FROM walk_in_bookings WHERE archived = 0 ORDER BY created_at DESC;
