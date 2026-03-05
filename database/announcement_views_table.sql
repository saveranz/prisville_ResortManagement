-- ============================================
-- ANNOUNCEMENT VIEWS TABLE
-- ============================================
-- Tracks which users have viewed which announcements

CREATE TABLE IF NOT EXISTS announcement_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_view (announcement_id, user_id),
  INDEX idx_announcement (announcement_id),
  INDEX idx_user (user_id),
  
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
