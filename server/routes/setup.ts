import { RequestHandler } from "express";
import db from "../db";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";

const SALT_ROUNDS = 10;

export const setupDatabase: RequestHandler = async (_req, res) => {
  try {
    // Create room_bookings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS room_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        room_name VARCHAR(255) NOT NULL,
        room_type VARCHAR(50),
        room_numbers VARCHAR(255) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        actual_check_in TIMESTAMP NULL,
        actual_check_out TIMESTAMP NULL,
        guests INT NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        special_requests TEXT,
        extra_items JSON NULL,
        total_amount VARCHAR(50) NOT NULL,
        payment_proof LONGTEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        room_status ENUM('vacant','occupied','checked_out','maintenance') DEFAULT 'vacant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_email (user_email),
        INDEX idx_status (status),
        INDEX idx_check_in (check_in),
        INDEX idx_room_type (room_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create amenity_bookings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS amenity_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        amenity_name VARCHAR(255) NOT NULL,
        amenity_type VARCHAR(100) NOT NULL,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        guests INT NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        event_details TEXT,
        total_amount VARCHAR(50) NOT NULL,
        payment_proof LONGTEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_email (user_email),
        INDEX idx_status (status),
        INDEX idx_booking_date (booking_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create day_pass_bookings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS day_pass_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        booking_date DATE NOT NULL,
        number_of_pax INT NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        special_requests TEXT,
        total_amount VARCHAR(50) NOT NULL,
        payment_proof LONGTEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_email (user_email),
        INDEX idx_status (status),
        INDEX idx_booking_date (booking_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create day_pass_guests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS day_pass_guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        age INT,
        gender ENUM('male', 'female', 'other') DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES day_pass_bookings(id) ON DELETE CASCADE,
        INDEX idx_booking_id (booking_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create inventory_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        unit_price VARCHAR(50) NOT NULL,
        supplier VARCHAR(255) NULL,
        expiry_date DATE NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_item_name (item_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create inventory_transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        type ENUM('received', 'issued') NOT NULL,
        quantity INT NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        supplier VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item_id (item_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create financial_transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('income', 'expense') NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount VARCHAR(50) NOT NULL,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_category (category),
        INDEX idx_transaction_date (transaction_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create user_preferences table for CRM
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        preferred_room_types VARCHAR(255),
        preferred_amenities VARCHAR(255),
        budget_range VARCHAR(50),
        interests VARCHAR(500),
        special_occasions VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create user_activity_tracking table
    await db.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS day_pass_guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        age INT,
        gender ENUM('male', 'female', 'other') DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES day_pass_bookings(id) ON DELETE CASCADE,
        INDEX idx_booking_id (booking_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create room_extra_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS room_extra_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        price VARCHAR(50) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_item (room_id, item_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create staff users with hashed passwords
    console.log('Creating staff users...');
    
    // Delete existing staff users if they exist
    await db.query('DELETE FROM users WHERE email IN (?, ?)', 
      ['receptionist@prisville.com', 'admin@prisville.com']
    );

    // Hash passwords
    const receptionistPassword = await bcrypt.hash('receptionist123', SALT_ROUNDS);
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

    // Create receptionist user
    await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['receptionist@prisville.com', receptionistPassword, 'Receptionist User', 'receptionist']
    );

    // Create admin user
    await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@prisville.com', adminPassword, 'Admin User', 'admin']
    );

    console.log('✅ Staff users created successfully');

    res.json({
      success: true,
      message: 'Database tables created successfully'
    });
  } catch (error) {
    console.error('Setup database error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const migrateRoomType: RequestHandler = async (_req, res) => {
  try {
    console.log('🔄 Running migration to add room_type column...');
    
    // Check if column exists
    const [columns] = await db.query(
      `SELECT COUNT(*) as count FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = 'room_bookings' 
       AND column_name = 'room_type'`
    );
    
    const columnExists = (columns as any)[0].count > 0;
    
    if (columnExists) {
      console.log('✅ Column room_type already exists');
      res.json({
        success: true,
        message: 'Column room_type already exists - no migration needed'
      });
      return;
    }
    
    // Add column
    await db.query(
      `ALTER TABLE room_bookings ADD COLUMN room_type VARCHAR(50) AFTER room_name`
    );
    console.log('✅ Added room_type column');
    
    // Add index
    await db.query(
      `ALTER TABLE room_bookings ADD INDEX idx_room_type (room_type)`
    );
    console.log('✅ Added idx_room_type index');
    
    res.json({
      success: true,
      message: 'Migration completed successfully - room_type column added'
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
// Migration to add user status column for account management
export const migrateUserStatus: RequestHandler = async (_req, res) => {
  try {
    console.log('🔄 Running migration to add user status column...');
    
    // Check if column exists
    const [columns] = await db.query(
      `SELECT COUNT(*) as count FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = 'users' 
       AND column_name = 'status'`
    );
    
    const columnExists = (columns as any)[0].count > 0;
    
    if (columnExists) {
      console.log('✅ Column status already exists');
      res.json({
        success: true,
        message: 'Column status already exists - no migration needed'
      });
      return;
    }
    
    // Add column
    await db.query(
      `ALTER TABLE users ADD COLUMN status ENUM('active', 'locked', 'deleted') DEFAULT 'active' AFTER updated_at`
    );
    console.log('✅ Added status column');
    
    // Add index
    await db.query(
      `ALTER TABLE users ADD INDEX idx_status (status)`
    );
    console.log('✅ Added idx_status index');
    
    // Update existing records to be active
    await db.query(
      `UPDATE users SET status = 'active' WHERE status IS NULL`
    );
    console.log('✅ Set existing users to active status');

    res.json({
      success: true,
      message: 'Migration completed successfully - status column added'      
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const setupFAQs: RequestHandler = async (_req, res) => {
  try {
    // Create faqs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create guest_inquiries table
    await db.query(`
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
        responded_by INT NULL,
        responded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_inquiries_status ON guest_inquiries(status)
    `).catch(() => {}); // ignore if index already exists

    // Seed default FAQs only if table is empty
    const [existing] = await db.query<any[]>('SELECT COUNT(*) as count FROM faqs');
    const count = existing[0]?.count ?? 0;

    if (count === 0) {
      await db.query(`
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
        ('Is there a minimum stay requirement?', 'There is no minimum stay requirement for regular bookings. However, during peak seasons and holidays, a minimum 2-night stay may be required.', 'policies', 10)
      `);
    }

    res.json({
      success: true,
      message: count === 0
        ? 'FAQ and inquiry tables created and seeded with 10 default FAQs'
        : `FAQ and inquiry tables verified. ${count} FAQs already exist — no seeding needed.`
    });
  } catch (error) {
    console.error('❌ FAQ setup error:', error);
    res.status(500).json({
      success: false,
      message: 'FAQ setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Creates ALL tables that may be missing (rooms, amenities, site_settings, announcements, faqs, inquiries)
// Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS and only seeds empty tables
export const setupAllMissingTables: RequestHandler = async (_req, res) => {
  const results: string[] = [];

  try {
    // --- ROOMS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_name VARCHAR(100) NOT NULL UNIQUE,
        room_type ENUM('Standard Room (Aircon)', 'Non-Aircon Room', 'Family Fan Room', 'Large Family Room') NOT NULL,
        room_numbers VARCHAR(255) NOT NULL,
        capacity INT NOT NULL,
        price_per_night VARCHAR(50) NOT NULL,
        amenities TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [roomCount] = await db.query<any[]>('SELECT COUNT(*) as count FROM rooms');
    if (roomCount[0].count === 0) {
      await db.query(`
        INSERT INTO rooms (room_name, room_type, room_numbers, capacity, price_per_night, amenities, description) VALUES
        ('Standard Room (Aircon)', 'Standard Room (Aircon)', '101, 102, 103, 201, 202, 203', 2, '₱1,600', 'Air conditioning, Double bed, TV, Private bathroom', 'Comfortable standard room with air conditioning, perfect for couples or solo travelers.'),
        ('Non-Aircon Room', 'Non-Aircon Room', '109, 110, 111, 209, 210', 3, '₱800', 'Fan, Double bed, TV, Private bathroom', 'Budget-friendly room with fan, suitable for backpackers and budget-conscious travelers.'),
        ('Family Fan Room', 'Family Fan Room', '105, 106, 107, 205, 206', 4, '₱1,600', 'Fans, Multiple beds, TV, Private bathroom, Spacious layout', 'Spacious family room with multiple beds and fan cooling, ideal for small families.'),
        ('Large Family Room', 'Large Family Room', '104, 108, 204, 208', 6, '₱3,200', 'Air conditioning, Multiple beds, TV, Private bathroom, Extra space', 'Large family room with air conditioning, perfect for bigger families or groups.')
      `);
      results.push('rooms: created + seeded 4 rooms');
    } else {
      results.push(`rooms: already exists (${roomCount[0].count} rows)`);
    }

    // --- AMENITIES ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS amenities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        amenity_name VARCHAR(100) NOT NULL UNIQUE,
        amenity_type ENUM('pool', 'function-hall', 'conference', 'picnic', 'karaoke', 'sports') NOT NULL,
        capacity INT NOT NULL,
        price_per_pax VARCHAR(50),
        base_price VARCHAR(50),
        operating_hours VARCHAR(100),
        features TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [amenityCount] = await db.query<any[]>('SELECT COUNT(*) as count FROM amenities');
    if (amenityCount[0].count === 0) {
      await db.query(`
        INSERT INTO amenities (amenity_name, amenity_type, capacity, price_per_pax, base_price, operating_hours, features, description) VALUES
        ('Swimming Pool', 'pool', 50, '₱500', NULL, '6:00 AM - 8:00 PM', 'Olympic-size pool, Kiddie pool, Lifeguard on duty', 'Enjoy our resort-style swimming pool with separate adult and children areas.'),
        ('Grand Function Hall', 'function-hall', 200, NULL, '₱35,000', 'Flexible booking', 'Stage, Sound system, Projector, Tables and chairs', 'Perfect for weddings, corporate events, and large gatherings.'),
        ('Conference Room', 'conference', 30, '₱400', '₱12,000', '8:00 AM - 6:00 PM', 'Projector, Whiteboard, WiFi, Air conditioning', 'Professional meeting space ideal for corporate events and seminars.'),
        ('Picnic Area A', 'picnic', 20, '₱200', NULL, '7:00 AM - 7:00 PM', 'BBQ grills, Picnic tables, Covered area', 'Outdoor picnic area with BBQ facilities.'),
        ('Picnic Area B', 'picnic', 15, '₱150', NULL, '7:00 AM - 7:00 PM', 'BBQ grills, Picnic tables, Garden view', 'Smaller picnic area with beautiful garden views.'),
        ('Karaoke Room', 'karaoke', 15, '₱250', NULL, '2:00 PM - 12:00 AM', 'Karaoke machine, Sound system, Disco lights', 'Private karaoke room with modern equipment.'),
        ('Basketball Court', 'sports', 10, NULL, '₱1,000', '6:00 AM - 10:00 PM', 'Full court, Lighting, Basketball provided', 'Full-size outdoor basketball court.'),
        ('Badminton Court', 'sports', 4, NULL, '₱500', '6:00 AM - 9:00 PM', 'Indoor court, Rackets and shuttlecocks included', 'Indoor badminton court with equipment provided.')
      `);
      results.push('amenities: created + seeded 8 amenities');
    } else {
      results.push(`amenities: already exists (${amenityCount[0].count} rows)`);
    }

    // --- SITE SETTINGS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('text', 'color', 'image', 'number', 'boolean') DEFAULT 'text',
        category VARCHAR(50) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [settingsCount] = await db.query<any[]>('SELECT COUNT(*) as count FROM site_settings');
    if (settingsCount[0].count === 0) {
      await db.query(`
        INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description) VALUES
        ('site_name', 'Prisville Resort', 'text', 'branding', 'Name of the resort'),
        ('site_tagline', 'Your Perfect Getaway Destination', 'text', 'branding', 'Site tagline'),
        ('site_logo_url', '', 'image', 'branding', 'URL to the main logo'),
        ('hero_image_url', '', 'image', 'branding', 'Main hero/banner image URL'),
        ('primary_color', '#8B5CF6', 'color', 'colors', 'Primary brand color'),
        ('accent_color', '#EC4899', 'color', 'colors', 'Accent/secondary color'),
        ('welcome_message', 'Welcome to Prisville Resort! Book your perfect vacation with us.', 'text', 'content', 'Homepage welcome message'),
        ('contact_email', 'resortprisvilletriangle@gmail.com', 'text', 'content', 'Contact email address'),
        ('contact_phone', '+63 123-456-7890', 'text', 'content', 'Contact phone number'),
        ('footer_text', '© 2026 Prisville Resort. All rights reserved.', 'text', 'content', 'Footer copyright text'),
        ('show_announcements', 'true', 'boolean', 'layout', 'Show announcements banner'),
        ('show_recommendations', 'true', 'boolean', 'layout', 'Show recommendations section')
      `);
      results.push('site_settings: created + seeded 12 default settings');
    } else {
      results.push(`site_settings: already exists (${settingsCount[0].count} rows)`);
    }

    // --- ANNOUNCEMENTS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_audience ENUM('all', 'clients', 'staff', 'specific') DEFAULT 'all',
        target_user_ids JSON NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
        banner_color VARCHAR(50) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'info',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        views_count INT DEFAULT 0,
        INDEX idx_active_dates (is_active, start_date, end_date),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    results.push('announcements: table ready');

    // --- ANNOUNCEMENT VIEWS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcement_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        user_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_view (announcement_id, user_id),
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    results.push('announcement_views: table ready');

    // --- FAQS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [faqCount] = await db.query<any[]>('SELECT COUNT(*) as count FROM faqs');
    if (faqCount[0].count === 0) {
      await db.query(`
        INSERT INTO faqs (question, answer, category, display_order) VALUES
        ('What are your check-in and check-out times?', 'Check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out are subject to availability and may incur additional charges.', 'booking', 1),
        ('How do I make a reservation?', 'You can make a reservation directly through our website by selecting your desired room or amenity, choosing your dates, and completing the booking form. You will need to provide payment proof for confirmation.', 'booking', 2),
        ('What is your cancellation policy?', 'We do not allow cancellations. All bookings are final and non-refundable once confirmed. Please ensure your travel dates are confirmed before making a reservation.', 'booking', 3),
        ('Do you offer day passes?', 'Yes! We offer day passes that give you access to our resort facilities for the day. Day passes can be booked through our website and include access to the swimming pool and common areas.', 'facilities', 4),
        ('What amenities are included in the room?', 'All our rooms include comfortable beds, private bathrooms, TV, and free WiFi. Air-conditioned rooms also include climate control. Please check the specific room details for complete amenity lists.', 'facilities', 5),
        ('Is there parking available?', 'Yes, we provide complimentary parking for all our guests. Parking is available on a first-come, first-served basis.', 'facilities', 6),
        ('Can I book amenities like the function hall or swimming pool?', 'Absolutely! Our amenities including the swimming pool, function halls, conference rooms, and picnic areas can be booked separately. Check our Amenities section for details.', 'facilities', 7),
        ('What payment methods do you accept?', 'We accept GCash and bank transfers only. You will need to upload payment proof when making your reservation.', 'payment', 8),
        ('Are pets allowed?', 'Unfortunately, we do not allow pets at this time, with the exception of service animals.', 'policies', 9),
        ('Is there a minimum stay requirement?', 'There is no minimum stay requirement for regular bookings. However, during peak seasons and holidays, a minimum 2-night stay may be required.', 'policies', 10)
      `);
      results.push('faqs: created + seeded 10 default FAQs');
    } else {
      results.push(`faqs: already exists (${faqCount[0].count} rows)`);
    }

    // --- GUEST INQUIRIES ---
    await db.query(`
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
        responded_by INT NULL,
        responded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    results.push('guest_inquiries: table ready');

    // --- ROOM EXTRA ITEMS ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS room_extra_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        price VARCHAR(50) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_item (room_id, item_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    results.push('room_extra_items: table ready');

    // --- MIGRATIONS: Add missing columns to room_bookings ---
    const addColumnIfNotExists = async (table: string, column: string, definition: string) => {
      const [cols] = await db.query<any[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (cols.length === 0) {
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        results.push(`migration: added ${table}.${column}`);
      }
    };

    await addColumnIfNotExists('room_bookings', 'extra_items', 'JSON NULL AFTER special_requests');
    await addColumnIfNotExists('room_bookings', 'actual_check_in', 'TIMESTAMP NULL AFTER check_out');
    await addColumnIfNotExists('room_bookings', 'actual_check_out', 'TIMESTAMP NULL AFTER actual_check_in');
    await addColumnIfNotExists('room_bookings', 'room_status', "ENUM('vacant','occupied','checked_out','maintenance') DEFAULT 'vacant' AFTER status");

    // --- MIGRATIONS: Add missing columns to inventory_items ---
    await addColumnIfNotExists('inventory_items', 'min_stock', 'INT NOT NULL DEFAULT 0 AFTER quantity');
    await addColumnIfNotExists('inventory_items', 'supplier', 'VARCHAR(255) NULL AFTER unit_price');
    await addColumnIfNotExists('inventory_items', 'expiry_date', 'DATE NULL AFTER supplier');

    // Create inventory_transactions table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        type ENUM('received', 'issued') NOT NULL,
        quantity INT NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        supplier VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item_id (item_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    results.push('inventory_transactions: table ready');

    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ setup-all error:', error);
    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      resultsBeforeError: results
    });
  }
};