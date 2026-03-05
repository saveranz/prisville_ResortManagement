-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- Stores user-specific notifications for bookings, events, and updates

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('booking', 'event', 'announcement', 'system', 'payment', 'status_change') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  -- Metadata for different notification types
  related_booking_id INT NULL,
  related_booking_type ENUM('room', 'amenity', 'day_pass') NULL,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at DESC),
  INDEX idx_type (type),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
