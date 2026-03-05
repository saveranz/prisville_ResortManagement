-- ============================================
-- FAQ TABLE - Frequently Asked Questions
-- ============================================

CREATE TABLE IF NOT EXISTS faqs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
('What are your check-in and check-out times?', 'Check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out are subject to availability and may incur additional charges.', 'booking', 1),
('How do I make a reservation?', 'You can make a reservation directly through our website by selecting your desired room or amenity, choosing your dates, and completing the booking form. You will need to provide payment proof for confirmation.', 'booking', 2),
('What is your cancellation policy?', 'We do not allow cancellations. All bookings are final and non-refundable once confirmed. Please ensure your travel dates are confirmed before making a reservation.', 'booking', 3),
('Do you offer day passes?', 'Yes! We offer day passes that give you access to our resort facilities for the day. Day passes can be booked through our website and include access to the swimming pool and common areas.', 'facilities', 4),
('What amenities are included in the room?', 'All our rooms include comfortable beds, private bathrooms, TV, and free WiFi. Air-conditioned rooms also include climate control. Please check the specific room details for complete amenity lists.', 'facilities', 5),
('Is there parking available?', 'Yes, we provide complimentary parking for all our guests. Parking is available on a first-come, first-served basis.', 'facilities', 6),
('Can I book amenities like the function hall or swimming pool?', 'Absolutely! Our amenities including the swimming pool, function halls, conference rooms, and picnic areas can be booked separately. Each has different pricing and capacity. Check our Amenities section for details.', 'facilities', 7),
('What payment methods do you accept?', 'We accept GCash and bank transfers only. You will need to upload payment proof when making your reservation.', 'payment', 8),
('Are pets allowed?', 'Unfortunately, we do not allow pets at this time, with the exception of service animals.', 'policies', 9),
('Is there a minimum stay requirement?', 'There is no minimum stay requirement for regular bookings. However, during peak seasons and holidays, a minimum 2-night stay may be required.', 'policies', 10);

-- ============================================
-- GUEST INQUIRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS guest_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  response TEXT,
  responded_by INT,
  responded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster queries
CREATE INDEX idx_inquiries_status ON guest_inquiries(status);
CREATE INDEX idx_inquiries_created ON guest_inquiries(created_at);
