-- Safe local database setup script
-- Run this in your local prisville02 database
-- This version handles errors gracefully

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

-- 2. Create day_pass_walk_in table if it doesn't exist
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

-- 3. Insert sample day pass walk-in data (only if table is empty)
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at)
SELECT * FROM (
  SELECT 'Judith' as representative_name, 22 as number_of_pax, 'kubo' as cottage_type, 'day' as time_of_day, 600.00 as total_amount, '2026-04-02' as created_at
  UNION ALL SELECT 'Francis Bryan L. Aligata', 9, 'kubo', 'day', 400.00, '2026-04-03'
  UNION ALL SELECT 'Ronilo Seco', 9, 'concrete', 'day', 400.00, '2026-04-04'
  UNION ALL SELECT 'Kier', 17, 'concrete', 'day', 500.00, '2026-04-05'
  UNION ALL SELECT 'Gabriel Princes D. Rosas', 13, 'concrete', 'day', 500.00, '2026-04-06'
  UNION ALL SELECT 'Dane Urbano', 16, 'kubo', 'day', 500.00, '2026-04-07'
  UNION ALL SELECT 'Eli Doce', 8, 'concrete', 'day', 400.00, '2026-04-09'
  UNION ALL SELECT 'Mary Rose Arellano', 14, 'kubo', 'day', 500.00, '2026-04-10'
  UNION ALL SELECT 'Mary Ann M. Jalac', 16, 'kubo', 'day', 500.00, '2026-04-11'
  UNION ALL SELECT 'Andrea', 7, 'concrete', 'day', 400.00, '2026-04-12'
  UNION ALL SELECT 'Anthony', 8, 'concrete', 'day', 500.00, '2026-04-13'
  UNION ALL SELECT 'Dianne', 19, 'kubo', 'day', 500.00, '2026-04-14'
  UNION ALL SELECT 'Queenie', 9, 'concrete', 'day', 500.00, '2026-04-15'
  UNION ALL SELECT 'Jessica', 15, 'concrete', 'day', 500.00, '2026-04-17'
  UNION ALL SELECT 'Jelo', 12, 'kubo', 'day', 500.00, '2026-04-20'
  UNION ALL SELECT 'Nonato M. Sarmiento', 10, 'kubo', 'day', 500.00, '2026-04-23'
  UNION ALL SELECT 'Khim', 7, 'kubo', 'day', 500.00, '2026-04-24'
  UNION ALL SELECT 'Jhackielyn Libres', 12, 'kubo', 'day', 500.00, '2026-04-26'
  UNION ALL SELECT 'Princess', 13, 'concrete', 'day', 400.00, '2026-04-27'
  UNION ALL SELECT 'Diane', 14, 'kubo', 'day', 100.00, '2026-04-28'
  UNION ALL SELECT 'Jian', 9, 'kubo', 'day', 500.00, '2026-04-29'
  UNION ALL SELECT 'Mary Grace Manalo', 10, 'kubo', 'day', 1000.00, '2026-05-02'
  UNION ALL SELECT 'Eloisa Villanueva', 15, 'concrete', 'day', 2550.00, '2026-05-03'
  UNION ALL SELECT 'Lorena Famerial', 12, 'concrete', 'day', 400.00, '2026-05-04'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM day_pass_walk_in LIMIT 1);

-- 4. Verify everything
SELECT 'walk_in_bookings' as table_name, COUNT(*) as count FROM walk_in_bookings
UNION ALL
SELECT 'day_pass_walk_in', COUNT(*) FROM day_pass_walk_in;

SELECT '✅ Setup complete!' as status;
