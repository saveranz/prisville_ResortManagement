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
        guests INT NOT NULL,
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
        unit VARCHAR(50) NOT NULL,
        unit_price VARCHAR(50) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_item_name (item_name)
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