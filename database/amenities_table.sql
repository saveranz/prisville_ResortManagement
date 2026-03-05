-- ============================================
-- AMENITIES TABLE - Master list of all available amenities
-- ============================================

CREATE TABLE IF NOT EXISTS amenities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  amenity_name VARCHAR(100) NOT NULL UNIQUE,
  amenity_type ENUM('pool', 'function-hall', 'conference', 'picnic', 'karaoke', 'sports') NOT NULL,
  capacity INT NOT NULL COMMENT 'Maximum number of guests',
  price_per_pax VARCHAR(50) COMMENT 'Price per person (if applicable)',
  base_price VARCHAR(50) COMMENT 'Base rental price (if not per pax)',
  operating_hours VARCHAR(100) COMMENT 'Operating hours or availability',
  features TEXT COMMENT 'List of amenity features',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default amenities
INSERT INTO amenities (amenity_name, amenity_type, capacity, price_per_pax, base_price, operating_hours, features, description) VALUES
('Swimming Pool', 'pool', 50, '₱500', NULL, '6:00 AM - 8:00 PM', 'Olympic-size pool, Kiddie pool, Lifeguard on duty, Pool toys available', 'Enjoy our resort-style swimming pool with separate adult and children areas.'),
('Grand Function Hall', 'function-hall', 200, NULL, '₱35,000', 'Flexible booking', 'Stage, Sound system, Projector, Tables and chairs, Catering area', 'Perfect for weddings, corporate events, and large gatherings. Includes full setup.'),
('Conference Room', 'conference', 30, '₱400', '₱12,000', '8:00 AM - 6:00 PM', 'Projector, Whiteboard, WiFi, Air conditioning, Coffee station', 'Professional meeting space ideal for corporate events and seminars.'),
('Picnic Area A', 'picnic', 20, '₱200', NULL, '7:00 AM - 7:00 PM', 'BBQ grills, Picnic tables, Covered area, Sink and water', 'Outdoor picnic area with BBQ facilities, perfect for family gatherings.'),
('Picnic Area B', 'picnic', 15, '₱150', NULL, '7:00 AM - 7:00 PM', 'BBQ grills, Picnic tables, Garden view', 'Smaller picnic area with beautiful garden views.'),
('Karaoke Room', 'karaoke', 15, '₱250', NULL, '2:00 PM - 12:00 AM', 'Karaoke machine, Sound system, Disco lights, Mini bar', 'Private karaoke room with modern equipment and fun lighting.'),
('Basketball Court', 'sports', 10, NULL, '₱1,000', '6:00 AM - 10:00 PM', 'Full court, Lighting, Basketball provided', 'Full-size outdoor basketball court with lighting for evening games.'),
('Badminton Court', 'sports', 4, NULL, '₱500', '6:00 AM - 9:00 PM', 'Indoor court, Rackets and shuttlecocks included', 'Indoor badminton court with equipment provided.');
