CREATE TABLE IF NOT EXISTS walk_in_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  number_of_pax INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guest_name (guest_name),
  INDEX idx_room_number (room_number),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
