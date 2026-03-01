-- Booking Issues Table - Track complaints, requests, and modifications
CREATE TABLE IF NOT EXISTS booking_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  booking_type ENUM('room', 'amenity', 'daypass') NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  issue_type ENUM('complaint', 'request', 'modification', 'cancellation', 'other') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  resolution TEXT,
  resolved_by INT,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_booking_id (booking_id),
  INDEX idx_booking_type (booking_type),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
