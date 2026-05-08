-- Complete local database setup script
-- Run this in your local prisville02 database

-- 1. Create walk_in_bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS walk_in_bookings (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  number_of_pax INT NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) DEFAULT 0.00,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  archived TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add archived column to inventory_items if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If you get an error "Duplicate column name 'archived'", that's OK - it means the column already exists
ALTER TABLE inventory_items ADD COLUMN archived TINYINT(1) DEFAULT 0;

-- 3. Create day_pass_walk_in table if it doesn't exist
CREATE TABLE IF NOT EXISTS day_pass_walk_in (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  representative_name VARCHAR(255) NOT NULL,
  number_of_pax INT NOT NULL,
  cottage_type ENUM('concrete', 'kubo') NOT NULL,
  time_of_day ENUM('day', 'night') NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insert sample day pass walk-in data
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) VALUES
('Judith', 22, 'kubo', 'day', 600.00, '2026-04-02'),
('Francis Bryan L. Aligata', 9, 'kubo', 'day', 400.00, '2026-04-03'),
('Ronilo Seco', 9, 'concrete', 'day', 400.00, '2026-04-04'),
('Kier', 17, 'concrete', 'day', 500.00, '2026-04-05'),
('Gabriel Princes D. Rosas', 13, 'concrete', 'day', 500.00, '2026-04-06'),
('Dane Urbano', 16, 'kubo', 'day', 500.00, '2026-04-07'),
('Eli Doce', 8, 'concrete', 'day', 400.00, '2026-04-09'),
('Mary Rose Arellano', 14, 'kubo', 'day', 500.00, '2026-04-10'),
('Mary Ann M. Jalac', 16, 'kubo', 'day', 500.00, '2026-04-11'),
('Andrea', 7, 'concrete', 'day', 400.00, '2026-04-12'),
('Anthony', 8, 'concrete', 'day', 500.00, '2026-04-13'),
('Dianne', 19, 'kubo', 'day', 500.00, '2026-04-14'),
('Queenie', 9, 'concrete', 'day', 500.00, '2026-04-15'),
('Jessica', 15, 'concrete', 'day', 500.00, '2026-04-17'),
('Jelo', 12, 'kubo', 'day', 500.00, '2026-04-20'),
('Nonato M. Sarmiento', 10, 'kubo', 'day', 500.00, '2026-04-23'),
('Khim', 7, 'kubo', 'day', 500.00, '2026-04-24'),
('Jhackielyn Libres', 12, 'kubo', 'day', 500.00, '2026-04-26'),
('Princess', 13, 'concrete', 'day', 400.00, '2026-04-27'),
('Diane', 14, 'kubo', 'day', 100.00, '2026-04-28'),
('Jian', 9, 'kubo', 'day', 500.00, '2026-04-29'),
('Mary Grace Manalo', 10, 'kubo', 'day', 1000.00, '2026-05-02'),
('Eloisa Villanueva', 15, 'concrete', 'day', 2550.00, '2026-05-03'),
('Lorena Famerial', 12, 'concrete', 'day', 400.00, '2026-05-04');

-- 5. Verify everything
SELECT 'walk_in_bookings' as table_name, COUNT(*) as count FROM walk_in_bookings
UNION ALL
SELECT 'day_pass_walk_in', COUNT(*) FROM day_pass_walk_in
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items;
