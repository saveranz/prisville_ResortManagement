-- ============================================
-- MOCK DATA FOR PRISVILLE RESORT DATABASE
-- ============================================
-- This file contains comprehensive test data for all tables
-- Run this after creating all tables

-- Disable foreign key checks for smooth data insertion
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. USERS (Clients, Staff, Admin)
-- ============================================

-- Ensure admin and receptionist exist first

INSERT IGNORE INTO users (id, email, password, name, role) VALUES 
(1, 'admin@prisville.com', 'admin123', 'Admin User', 'admin'),
(2, 'receptionist@prisville.com', 'receptionist123', 'Receptionist User', 'receptionist');

-- Client Users (with explicit IDs to ensure consistency)

INSERT INTO users (id, email, password, name, role) VALUES 
(3, 'john.doe@gmail.com', 'password123', 'John Doe', 'client'),
(4, 'maria.santos@yahoo.com', 'password123', 'Maria Santos', 'client'),
(5, 'peter.tan@outlook.com', 'password123', 'Peter Tan', 'client'),
(6, 'sarah.cruz@gmail.com', 'password123', 'Sarah Cruz', 'client'),
(7, 'mike.reyes@gmail.com', 'password123', 'Mike Reyes', 'client'),
(8, 'anna.garcia@yahoo.com', 'password123', 'Anna Garcia', 'client'),
(9, 'david.lim@gmail.com', 'password123', 'David Lim', 'client'),
(10, 'lisa.martinez@outlook.com', 'password123', 'Lisa Martinez', 'client')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- 2. ROOM BOOKINGS
-- ============================================

INSERT INTO room_bookings (user_id, user_email, room_name, room_numbers, check_in, check_out, guests, contact_number, special_requests, total_amount, payment_proof, status) VALUES 
(3, 'john.doe@gmail.com', 'Standard Room (Aircon)', '101', '2026-03-10', '2026-03-12', 2, '+63 917-123-4567', 'Early check-in if possible', '₱3,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(4, 'maria.santos@yahoo.com', 'Large Family Room', '104', '2026-03-15', '2026-03-18', 6, '+63 918-234-5678', 'Need extra towels and pillows', '₱9,600', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(5, 'peter.tan@outlook.com', 'Family Fan Room', '105', '2026-03-08', '2026-03-10', 4, '+63 919-345-6789', 'Celebrating anniversary', '₱3,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(6, 'sarah.cruz@gmail.com', 'Standard Room (Aircon)', '102', '2026-03-02', '2026-03-04', 2, '+63 920-456-7890', 'Late checkout requested', '₱3,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved'),
(7, 'mike.reyes@gmail.com', 'Large Family Room', '108', '2026-03-02', '2026-03-05', 5, '+63 921-567-8901', 'Birthday celebration', '₱9,600', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved'),
(8, 'anna.garcia@yahoo.com', 'Family Fan Room', '106', '2026-03-02', '2026-03-03', 4, '+63 922-678-9012', 'None', '₱1,600', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved');

INSERT INTO room_bookings (user_id, user_email, room_name, room_numbers, check_in, check_out, guests, contact_number, special_requests, total_amount, payment_proof, status, actual_check_in, room_status) VALUES 
(9, 'david.lim@gmail.com', 'Standard Room (Aircon)', '103', '2026-03-01', '2026-03-04', 2, '+63 923-789-0123', 'Honeymooners', '₱4,800', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved', '2026-03-01 14:30:00', 'checked_in'),
(10, 'lisa.martinez@outlook.com', 'Non-Aircon Room', '109', '2026-02-29', '2026-03-03', 3, '+63 924-890-1234', 'Budget stay', '₱2,400', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved', '2026-02-29 15:00:00', 'checked_in');

INSERT INTO room_bookings (user_id, user_email, room_name, room_numbers, check_in, check_out, guests, contact_number, special_requests, total_amount, payment_proof, status, actual_check_in, actual_check_out, room_status) VALUES 
(3, 'john.doe@gmail.com', 'Family Fan Room', '107', '2026-02-20', '2026-02-22', 4, '+63 917-123-4567', 'Family weekend getaway', '₱3,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved', '2026-02-20 14:00:00', '2026-02-22 11:30:00', 'checked_out'),
(4, 'maria.santos@yahoo.com', 'Standard Room (Aircon)', '101', '2026-02-15', '2026-02-17', 2, '+63 918-234-5678', 'Romantic getaway', '₱3,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved', '2026-02-15 15:30:00', '2026-02-17 10:00:00', 'checked_out');

-- ============================================
-- 3. AMENITY BOOKINGS
-- ============================================

INSERT INTO amenity_bookings (user_id, user_email, amenity_name, amenity_type, booking_date, start_time, end_time, guests, contact_number, event_details, total_amount, payment_proof, status) VALUES 
(3, 'john.doe@gmail.com', 'Swimming Pool', 'pool', '2026-03-10', '09:00:00', '12:00:00', 10, '+63 917-123-4567', 'Kids birthday party with pool games', '₱5,000', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(5, 'peter.tan@outlook.com', 'Grand Function Hall', 'function-hall', '2026-03-20', '18:00:00', '23:00:00', 80, '+63 919-345-6789', 'Wedding reception - need full setup with catering', '₱35,000', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(4, 'maria.santos@yahoo.com', 'Picnic Area A', 'picnic', '2026-03-05', '10:00:00', '16:00:00', 15, '+63 918-234-5678', 'Family reunion with BBQ', '₱3,500', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved'),
(7, 'mike.reyes@gmail.com', 'Karaoke Room', 'karaoke', '2026-03-08', '19:00:00', '23:00:00', 12, '+63 921-567-8901', 'Friends night out', '₱4,000', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved');

INSERT INTO amenity_bookings (user_id, user_email, amenity_name, amenity_type, booking_date, start_time, end_time, guests, contact_number, event_details, total_amount, payment_proof, status) VALUES 
(6, 'sarah.cruz@gmail.com', 'Conference Room', 'conference', '2026-02-25', '09:00:00', '17:00:00', 25, '+63 920-456-7890', 'Corporate team building', '₱12,000', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved');

-- ============================================
-- 4. DAY PASS BOOKINGS
-- ============================================

INSERT INTO day_pass_bookings (user_id, user_email, booking_date, number_of_pax, contact_number, special_requests, total_amount, payment_proof, status) VALUES 
(8, 'anna.garcia@yahoo.com', '2026-03-09', 8, '+63 922-678-9012', 'Need life vests for kids', '₱2,400', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(9, 'david.lim@gmail.com', '2026-03-12', 5, '+63 923-789-0123', 'Coming for swimming only', '₱1,500', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'pending'),
(10, 'lisa.martinez@outlook.com', '2026-03-02', 6, '+63 924-890-1234', 'Day outing with family', '₱1,800', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved');

INSERT INTO day_pass_bookings (user_id, user_email, booking_date, number_of_pax, contact_number, special_requests, total_amount, payment_proof, status) VALUES 
(3, 'john.doe@gmail.com', '2026-02-28', 4, '+63 917-123-4567', 'None', '₱1,200', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', 'approved');

-- ============================================
-- 5. INVENTORY ITEMS
-- ============================================

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES 
('Bed Sheets (Queen)', 'Linens', 50, 'pcs', '₱450'),
('Bed Sheets (King)', 'Linens', 30, 'pcs', '₱550'),
('Pillows', 'Linens', 80, 'pcs', '₱250'),
('Blankets', 'Linens', 60, 'pcs', '₱350'),
('Bath Towels', 'Linens', 100, 'pcs', '₱150'),
('Hand Towels', 'Linens', 150, 'pcs', '₱80'),
('Shampoo Bottles', 'Toiletries', 200, 'pcs', '₱25'),
('Soap Bars', 'Toiletries', 250, 'pcs', '₱15'),
('Toilet Paper Rolls', 'Toiletries', 180, 'rolls', '₱20'),
('Toothbrush Sets', 'Toiletries', 100, 'sets', '₱30'),
('Disinfectant Spray', 'Cleaning', 25, 'bottles', '₱120'),
('Floor Cleaner', 'Cleaning', 30, 'bottles', '₱95'),
('Glass Cleaner', 'Cleaning', 20, 'bottles', '₱85'),
('Mop Heads', 'Cleaning', 15, 'pcs', '₱180'),
('Trash Bags (Large)', 'Cleaning', 200, 'pcs', '₱8'),
('Plates', 'Kitchen', 120, 'pcs', '₱75'),
('Glasses', 'Kitchen', 150, 'pcs', '₱45'),
('Utensils Set', 'Kitchen', 80, 'sets', '₱120'),
('Coffee Cups', 'Kitchen', 100, 'pcs', '₱55'),
('Pool Chlorine', 'Pool', 40, 'kg', '₱380'),
('Life Vests (Adult)', 'Pool', 25, 'pcs', '₱450'),
('Life Vests (Kids)', 'Pool', 30, 'pcs', '₱350'),
('Pool Floats', 'Pool', 20, 'pcs', '₱280'),
('Light Bulbs (LED)', 'Maintenance', 60, 'pcs', '₱85'),
('Air Freshener', 'Maintenance', 45, 'cans', '₱65'),
('Batteries (AA)', 'Maintenance', 100, 'pcs', '₱25'),
('Extension Cords', 'Maintenance', 15, 'pcs', '₱250');

-- ============================================
-- 6. FINANCIAL TRANSACTIONS
-- ============================================

INSERT INTO financial_transactions (type, category, description, amount, transaction_date) VALUES 
('income', 'Room Booking', 'Room 101 - John Doe - 2 nights', '₱3,200', '2026-02-20'),
('income', 'Room Booking', 'Room 103 - David Lim - 3 nights', '₱4,800', '2026-03-01'),
('income', 'Amenity Booking', 'Conference Room - Sarah Cruz', '₱12,000', '2026-02-25'),
('income', 'Day Pass', 'Day Pass - 4 pax', '₱1,200', '2026-02-28'),
('income', 'Room Booking', 'Room 109 - Lisa Martinez - 3 nights', '₱2,400', '2026-02-29'),
('income', 'Food & Beverage', 'Restaurant sales - Feb 28', '₱8,500', '2026-02-28'),
('income', 'Food & Beverage', 'Restaurant sales - Mar 1', '₱9,200', '2026-03-01'),
('income', 'Miscellaneous', 'Extra bedding charge', '₱500', '2026-03-01'),
('expense', 'Supplies', 'Purchased linens and towels', '₱15,500', '2026-02-28'),
('expense', 'Utilities', 'Electricity bill - February', '₱28,000', '2026-03-01'),
('expense', 'Utilities', 'Water bill - February', '₱12,000', '2026-03-01'),
('expense', 'Maintenance', 'Aircon servicing - Rooms 101-103', '₱6,500', '2026-02-27'),
('expense', 'Supplies', 'Pool chemicals and cleaning supplies', '₱8,200', '2026-02-26'),
('expense', 'Staff', 'Staff salaries - February', '₱85,000', '2026-02-28'),
('expense', 'Food & Beverage', 'Kitchen supplies and ingredients', '₱18,500', '2026-02-29'),
('expense', 'Maintenance', 'Plumbing repair - Room 105', '₱3,200', '2026-02-25'),
('expense', 'Marketing', 'Social media advertising', '₱5,000', '2026-03-01'),
('expense', 'Miscellaneous', 'Office supplies', '₱2,800', '2026-02-28');

-- ============================================
-- 7. ROOM STATUS UPDATES
-- ============================================

UPDATE room_status SET status = 'occupied' , current_booking_id = 9, current_guest_email = 'david.lim@gmail.com', last_cleaned = '2026-03-01 13:00:00' WHERE room_numbers = '103';
UPDATE room_status SET status = 'occupied', current_booking_id = 10, current_guest_email = 'lisa.martinez@outlook.com', last_cleaned = '2026-02-29 13:30:00' WHERE room_numbers = '109';
UPDATE room_status SET status = 'reserved', last_cleaned = '2026-03-01 10:00:00' WHERE room_numbers = '102';
UPDATE room_status SET status = 'reserved', last_cleaned = '2026-03-01 10:30:00' WHERE room_numbers = '108';
UPDATE room_status SET status = 'reserved', last_cleaned = '2026-03-01 11:00:00' WHERE room_numbers = '106';
UPDATE room_status SET status = 'cleaning', last_cleaned = '2026-03-01 09:00:00' WHERE room_numbers = '101';
UPDATE room_status SET status = 'available', last_cleaned = '2026-02-28 14:00:00' WHERE room_numbers = '104';
UPDATE room_status SET status = 'available', last_cleaned = '2026-02-28 14:30:00' WHERE room_numbers = '105';
UPDATE room_status SET status = 'maintenance', notes = 'AC unit needs repair', last_maintenance = '2026-03-01 08:00:00' WHERE room_numbers = '107';
UPDATE room_status SET status = 'available', last_cleaned = '2026-02-28 15:00:00' WHERE room_numbers = '110';

-- ============================================
-- 8. STAY HISTORY
-- ============================================

INSERT INTO stay_history (user_id, user_email, booking_id, booking_type, room_name, check_in_date, check_out_date, actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes, rating) VALUES 
(3, 'john.doe@gmail.com', 11, 'room', 'Family Fan Room', '2026-02-20', '2026-02-22', '2026-02-20 14:00:00', '2026-02-22 11:30:00', 2, 4, 3200.00, 'completed', 'Very satisfied guests, left a tip', 5),
(4, 'maria.santos@yahoo.com', 12, 'room', 'Standard Room (Aircon)', '2026-02-15', '2026-02-17', '2026-02-15 15:30:00', '2026-02-17 10:00:00', 2, 2, 3200.00, 'completed', 'Requested late checkout, room in good condition', 4),
(9, 'david.lim@gmail.com', 9, 'room', 'Standard Room (Aircon)', '2026-03-01', '2026-03-04', '2026-03-01 14:30:00', NULL, 0, 2, 4800.00, 'completed', 'Honeymooners - very quiet guests', NULL),
(10, 'lisa.martinez@outlook.com', 10, 'room', 'Non-Aircon Room', '2026-02-29', '2026-03-03', '2026-02-29 15:00:00', NULL, 0, 3, 2400.00, 'completed', 'Budget-conscious family', NULL);

-- ============================================
-- 9. BOOKING ISSUES
-- ============================================

INSERT INTO booking_issues (booking_id, booking_type, user_email, issue_type, priority, subject, description, status) VALUES 
(9, 'room', 'david.lim@gmail.com', 'request', 'medium', 'Extra Pillows Needed', 'Guest requested 2 additional pillows for room 103. Honeymooners requested extra comfort.', 'open'),
(5, 'room', 'mike.reyes@gmail.com', 'modification', 'high', 'Change Check-in Date', 'Guest needs to move check-in from March 2 to March 3 due to flight delay. Need to update booking.', 'in_progress'),
(10, 'room', 'lisa.martinez@outlook.com', 'complaint', 'low', 'Noisy Neighbors', 'Guest complained about noise from adjacent room during late night. Staff spoke to other guests.', 'resolved'),
(3, 'amenity', 'john.doe@gmail.com', 'request', 'medium', 'Additional Pool Equipment', 'Requested extra life vests for kids party. Provided from inventory.', 'resolved');

UPDATE booking_issues SET resolved_at = '2026-03-01 20:30:00', resolved_by = 2, resolution = 'Spoke with guests in adjacent room. Issue resolved peacefully.' WHERE id = 3;
UPDATE booking_issues SET resolved_at = '2026-02-28 16:00:00', resolved_by = 2, resolution = 'Provided 5 additional life vests from pool equipment inventory.' WHERE id = 4;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- SUMMARY
-- ============================================
-- This mock data includes:
-- - 8 client users + existing staff users
-- - 10 room bookings (pending, approved, checked-in, completed)
-- - 5 amenity bookings (various statuses)
-- - 4 day pass bookings
-- - 27 inventory items across multiple categories
-- - 18 financial transactions (8 income, 10 expenses)
-- - Updated room statuses for 10 rooms
-- - 4 stay history records
-- - 4 booking issues (open and resolved)
-- ============================================

SELECT 'Mock data inserted successfully!' AS status;
