CREATE TABLE IF NOT EXISTS day_pass_guests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES day_pass_bookings(id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
