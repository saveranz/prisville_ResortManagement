CREATE TABLE IF NOT EXISTS user_activity_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  activity_type ENUM('view_room', 'view_amenity', 'view_daypass', 'click_book', 'search', 'filter') NOT NULL,
  item_type VARCHAR(100) NULL,
  item_name VARCHAR(255) NULL,
  time_spent INT DEFAULT 0,
  additional_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Examples of what this tracks:
-- activity_type: 'view_room' - User viewed a room detail
-- activity_type: 'view_amenity' - User viewed an amenity detail
-- activity_type: 'view_daypass' - User viewed day pass details
-- activity_type: 'click_book' - User clicked a book button
-- activity_type: 'search' - User performed a search
-- activity_type: 'filter' - User applied filters
-- 
-- item_type: 'standard', 'deluxe', 'premium', 'event_space', 'function_hall', etc.
-- item_name: 'Standard Room', 'Deluxe Suite', 'Event Space', etc.
-- time_spent: Time spent viewing (in seconds)
-- additional_data: Any extra data in JSON format
