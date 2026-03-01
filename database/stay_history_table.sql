-- Stay History Table - Track guest stay records
CREATE TABLE IF NOT EXISTS stay_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  booking_id INT NOT NULL,
  booking_type ENUM('room', 'amenity', 'daypass') NOT NULL,
  room_name VARCHAR(255),
  amenity_name VARCHAR(255),
  check_in_date DATE,
  check_out_date DATE,
  actual_check_in TIMESTAMP NULL,
  actual_check_out TIMESTAMP NULL,
  nights_stayed INT DEFAULT 0,
  guests INT,
  total_spent DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'completed') DEFAULT 'completed',
  guest_notes TEXT,
  staff_notes TEXT,
  rating INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_user_email (user_email),
  INDEX idx_booking_type (booking_type),
  INDEX idx_check_in (check_in_date),
  INDEX idx_actual_check_in (actual_check_in)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: This table is populated when:
-- 1. A booking is approved (creates history entry)
-- 2. Guest checks in (updates actual_check_in)
-- 3. Guest checks out (updates actual_check_out and calculates nights_stayed)
