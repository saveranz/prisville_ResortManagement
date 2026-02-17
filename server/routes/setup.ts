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
