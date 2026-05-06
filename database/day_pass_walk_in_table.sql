CREATE TABLE IF NOT EXISTS day_pass_walk_in (
  id INT AUTO_INCREMENT PRIMARY KEY,
  representative_name VARCHAR(255) NOT NULL,
  number_of_pax INT NOT NULL,
  cottage ENUM('yes', 'no') NOT NULL,
  cottage_number VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_representative_name (representative_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
