-- Insert Walk-in Bookings into Stay History
-- This creates stay history records for walk-in room bookings with check-in/check-out times

-- First, ensure we have a generic walk-in user (if not exists)
INSERT IGNORE INTO users (email, password, role, status, email_verified)
VALUES ('walkin@prisville.com', '$2b$10$dummyhashforwalkinuser', 'guest', 'active', 1);

-- Get the walk-in user ID
SET @walkin_user_id = (SELECT id FROM users WHERE email = 'walkin@prisville.com' LIMIT 1);

-- Insert stay history for each walk-in booking
-- Note: Using the walk_in_bookings data to create corresponding stay_history entries
-- The guest_name column stores the actual guest name from walk-in records

-- Room 101: Maribel Bicac / Roland Guya - April 3, 2026
INSERT INTO stay_history 
  (user_id, user_email, guest_name, booking_id, booking_type, room_name, check_in_date, check_out_date, 
   actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes)
SELECT 
  @walkin_user_id,
  'walkin@prisville.com',
  guest_name,
  id,
  'room',
  room_number,
  DATE(created_at),
  DATE_ADD(DATE(created_at), INTERVAL 1 DAY),
  CONCAT(DATE(created_at), ' 13:08:00'),
  CONCAT(DATE_ADD(DATE(created_at), INTERVAL 1 DAY), ' 10:52:00'),
  1,
  number_of_pax,
  total_amount,
  'completed',
  CONCAT('Walk-in booking - Contact: ', contact_number)
FROM walk_in_bookings
WHERE room_number = 'Room 101' AND guest_name = 'Maribel Bicac / Roland Guya';

-- Room 102: Alma P. Miranda - April 3, 2026
INSERT INTO stay_history 
  (user_id, user_email, guest_name, booking_id, booking_type, room_name, check_in_date, check_out_date, 
   actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes)
SELECT 
  @walkin_user_id,
  'walkin@prisville.com',
  guest_name,
  id,
  'room',
  room_number,
  DATE(created_at),
  DATE_ADD(DATE(created_at), INTERVAL 1 DAY),
  CONCAT(DATE(created_at), ' 13:15:00'),
  CONCAT(DATE_ADD(DATE(created_at), INTERVAL 1 DAY), ' 11:03:00'),
  1,
  number_of_pax,
  total_amount,
  'completed',
  CONCAT('Walk-in booking - Contact: ', contact_number)
FROM walk_in_bookings
WHERE room_number = 'Room 102' AND guest_name = 'Alma P. Miranda';

-- Room 103: Reynaldo Ruga Uy - April 11, 2026
INSERT INTO stay_history 
  (user_id, user_email, guest_name, booking_id, booking_type, room_name, check_in_date, check_out_date, 
   actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes)
SELECT 
  @walkin_user_id,
  'walkin@prisville.com',
  guest_name,
  id,
  'room',
  room_number,
  DATE(created_at),
  DATE_ADD(DATE(created_at), INTERVAL 1 DAY),
  CONCAT(DATE(created_at), ' 13:12:00'),
  CONCAT(DATE_ADD(DATE(created_at), INTERVAL 1 DAY), ' 10:48:00'),
  1,
  number_of_pax,
  total_amount,
  'completed',
  CONCAT('Walk-in booking - Contact: ', contact_number)
FROM walk_in_bookings
WHERE room_number = 'Room 103' AND guest_name = 'Reynaldo Ruga Uy';

-- Room 104: Mjay Parafina - April 20, 2026
INSERT INTO stay_history 
  (user_id, user_email, guest_name, booking_id, booking_type, room_name, check_in_date, check_out_date, 
   actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes)
SELECT 
  @walkin_user_id,
  'walkin@prisville.com',
  guest_name,
  id,
  'room',
  room_number,
  DATE(created_at),
  DATE_ADD(DATE(created_at), INTERVAL 1 DAY),
  CONCAT(DATE(created_at), ' 13:05:00'),
  CONCAT(DATE_ADD(DATE(created_at), INTERVAL 1 DAY), ' 11:05:00'),
  1,
  number_of_pax,
  total_amount,
  'completed',
  CONCAT('Walk-in booking - Contact: ', contact_number)
FROM walk_in_bookings
WHERE room_number = 'Room 104' AND guest_name = 'Mjay Parafina';

-- Room 105: Elizabeth Asi - May 23, 2026
INSERT INTO stay_history 
  (user_id, user_email, guest_name, booking_id, booking_type, room_name, check_in_date, check_out_date, 
   actual_check_in, actual_check_out, nights_stayed, guests, total_spent, payment_status, staff_notes)
SELECT 
  @walkin_user_id,
  'walkin@prisville.com',
  guest_name,
  id,
  'room',
  room_number,
  DATE(created_at),
  DATE_ADD(DATE(created_at), INTERVAL 1 DAY),
  CONCAT(DATE(created_at), ' 13:10:00'),
  CONCAT(DATE_ADD(DATE(created_at), INTERVAL 1 DAY), ' 10:45:00'),
  1,
  number_of_pax,
  total_amount,
  'completed',
  CONCAT('Walk-in booking - Contact: ', contact_number)
FROM walk_in_bookings
WHERE room_number = 'Room 105' AND guest_name = 'Elizabeth Asi';

-- Verify the insertions
SELECT 
  sh.id,
  sh.guest_name,
  sh.room_name,
  sh.actual_check_in,
  sh.actual_check_out,
  sh.nights_stayed,
  sh.guests,
  CONCAT('₱', FORMAT(sh.total_spent, 2)) as total_spent,
  sh.staff_notes
FROM stay_history sh
WHERE sh.user_email = 'walkin@prisville.com'
ORDER BY sh.actual_check_in DESC;
