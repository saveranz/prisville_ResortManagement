-- ============================================
-- ROOM_EXTRA_ITEMS TABLE - Manage available extra items per room
-- ============================================

CREATE TABLE IF NOT EXISTS room_extra_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL COMMENT 'Name of the extra item (e.g., Extra Bed)',
  price VARCHAR(50) NOT NULL COMMENT 'Price formatted with ₱',
  unit VARCHAR(50) COMMENT 'Unit of measurement (e.g., bed, fan, set)',
  description TEXT COMMENT 'Optional description of the item',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_item (room_id, item_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample extra items for Standard Room
INSERT INTO room_extra_items (room_id, item_name, price, unit, description) VALUES
((SELECT id FROM rooms WHERE room_name = 'Standard Room (Aircon)'), 'Extra Bed', '₱150', 'bed', 'Additional bed for extra guest'),
((SELECT id FROM rooms WHERE room_name = 'Standard Room (Aircon)'), 'Stand Fan', '₱100', 'fan', 'Portable stand fan'),
((SELECT id FROM rooms WHERE room_name = 'Standard Room (Aircon)'), 'Towels', '₱50', 'set', 'Set of extra towels'),
((SELECT id FROM rooms WHERE room_name = 'Standard Room (Aircon)'), 'Beddings', '₱30', 'set', 'Extra bed linens set'),
((SELECT id FROM rooms WHERE room_name = 'Standard Room (Aircon)'), 'Pillows', '₱15', 'pillow', 'Extra pillow');
