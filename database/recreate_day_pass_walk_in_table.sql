-- Drop the existing table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS day_pass_walk_in;

-- Create the table with the new structure
CREATE TABLE day_pass_walk_in (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  representative_name VARCHAR(255) NOT NULL,
  number_of_pax INT NOT NULL,
  cottage_type ENUM('concrete', 'kubo') NOT NULL,
  time_of_day ENUM('day', 'night') NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Now you can run the insert_day_pass_walk_in_data.sql file to populate it
