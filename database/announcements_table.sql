-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
-- System-wide announcements published by administrators

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Announcement targeting
  target_audience ENUM('all', 'clients', 'staff', 'specific') DEFAULT 'all',
  target_user_ids JSON NULL COMMENT 'Array of user IDs for specific targeting',
  
  -- Scheduling and visibility
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NULL COMMENT 'NULL means no expiration',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Styling and priority
  priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
  banner_color VARCHAR(50) DEFAULT '#3b82f6' COMMENT 'Hex color for banner',
  icon VARCHAR(50) DEFAULT 'info' COMMENT 'Icon identifier',
  
  -- Metadata
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Engagement tracking
  views_count INT DEFAULT 0,
  
  INDEX idx_active_dates (is_active, start_date, end_date),
  INDEX idx_target (target_audience),
  INDEX idx_priority (priority),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
