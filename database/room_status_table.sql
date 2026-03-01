-- Room Status Table - Track real-time room availability and condition
CREATE TABLE IF NOT EXISTS room_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_name VARCHAR(255) NOT NULL,
  room_numbers VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'out_of_order') DEFAULT 'available',
  current_booking_id INT NULL,
  current_guest_email VARCHAR(255),
  last_cleaned TIMESTAMP NULL,
  last_maintenance TIMESTAMP NULL,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_numbers (room_numbers),
  INDEX idx_status (status),
  INDEX idx_current_booking (current_booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial room statuses
INSERT INTO room_status (room_name, room_numbers, status) VALUES
('Standard Room (Aircon)', '101', 'available'),
('Standard Room (Aircon)', '102', 'available'),
('Standard Room (Aircon)', '103', 'available'),
('Large Family Room', '104', 'available'),
('Family Fan Room', '105', 'available'),
('Family Fan Room', '106', 'available'),
('Family Fan Room', '107', 'available'),
('Large Family Room', '108', 'available'),
('Non-Aircon Room', '109', 'available'),
('Non-Aircon Room', '110', 'available')
ON DUPLICATE KEY UPDATE room_name=VALUES(room_name);
