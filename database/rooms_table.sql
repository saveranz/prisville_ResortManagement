-- ============================================
-- ROOMS TABLE - Master list of all available rooms
-- ============================================

CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_name VARCHAR(100) NOT NULL UNIQUE,
  room_type ENUM('Standard Room (Aircon)', 'Non-Aircon Room', 'Family Fan Room', 'Large Family Room') NOT NULL,
  room_numbers VARCHAR(255) NOT NULL COMMENT 'Available room numbers for this type',
  capacity INT NOT NULL COMMENT 'Maximum number of guests',
  price_per_night VARCHAR(50) NOT NULL COMMENT 'Price per night (formatted with ₱)',
  amenities TEXT COMMENT 'List of room amenities',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default rooms
INSERT INTO rooms (room_name, room_type, room_numbers, capacity, price_per_night, amenities, description) VALUES
('Standard Room (Aircon)', 'Standard Room (Aircon)', '101, 102, 103, 201, 202, 203', 2, '₱1,600', 'Air conditioning, Double bed, TV, Private bathroom', 'Comfortable standard room with air conditioning, perfect for couples or solo travelers.'),
('Non-Aircon Room', 'Non-Aircon Room', '109, 110, 111, 209, 210', 3, '₱800', 'Fan, Double bed, TV, Private bathroom', 'Budget-friendly room with fan, suitable for backpackers and budget-conscious travelers.'),
('Family Fan Room', 'Family Fan Room', '105, 106, 107, 205, 206', 4, '₱1,600', 'Fans, Multiple beds, TV, Private bathroom, Spacious layout', 'Spacious family room with multiple beds and fan cooling, ideal for small families.'),
('Large Family Room', 'Large Family Room', '104, 108, 204, 208', 6, '₱3,200', 'Air conditioning, Multiple beds, TV, Private bathroom, Extra space', 'Large family room with air conditioning, perfect for bigger families or groups.');
