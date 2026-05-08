import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface DayPassWalkIn extends RowDataPacket {
  id: number;
  representative_name: string;
  number_of_pax: number;
  cottage_type: 'concrete' | 'kubo';
  time_of_day: 'day' | 'night';
  total_amount: string;
  created_at: Date;
  updated_at: Date;
}

// Create a day pass walk-in (receptionist only)
export const createDayPassWalkIn: RequestHandler = async (req, res) => {
  try {
    console.log('📝 Day pass walk-in request received');
    
    // Check if user is logged in and is receptionist or admin
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login' 
      });
      return;
    }

    if (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist') {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
      return;
    }

    const {
      representativeName,
      numberOfPax,
      cottageType,
      timeOfDay,
      totalAmount
    } = req.body;

    console.log('📋 Day pass walk-in data:', {
      representativeName,
      numberOfPax,
      cottageType,
      timeOfDay,
      totalAmount
    });

    // Validate required fields
    if (!representativeName || !numberOfPax || !cottageType || !timeOfDay || !totalAmount) {
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    // Insert day pass walk-in
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO day_pass_walk_in 
      (representative_name, number_of_pax, cottage_type, time_of_day, total_amount) 
      VALUES (?, ?, ?, ?, ?)`,
      [representativeName, numberOfPax, cottageType, timeOfDay, totalAmount]
    );

    console.log('✅ Day pass walk-in recorded successfully with ID:', result.insertId);

    res.json({ 
      success: true, 
      message: 'Day pass walk-in recorded successfully!',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('❌ Create day pass walk-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record day pass walk-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all day pass walk-ins (receptionist only)
export const getAllDayPassWalkIns: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in and is receptionist or admin
    if (!req.session.userId) {
      console.log('❌ [DAY PASS WALK-IN API] Unauthorized - no userId in session');
      res.status(401).json({ 
        success: false, 
        message: 'Please login' 
      });
      return;
    }

    if (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist') {
      console.log('❌ [DAY PASS WALK-IN API] Forbidden - user role:', req.session.userRole);
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
      return;
    }

    console.log('🔍 [DAY PASS WALK-IN API] Fetching all day pass walk-ins...');
    console.log('🔍 [DAY PASS WALK-IN API] User:', req.session.userId, 'Role:', req.session.userRole);
    
    const [bookings] = await db.query<DayPassWalkIn[]>(
      `SELECT * FROM day_pass_walk_in ORDER BY created_at DESC`
    );
    
    console.log('✅ [DAY PASS WALK-IN API] Query executed successfully');
    console.log('✅ [DAY PASS WALK-IN API] Fetched bookings count:', bookings.length);
    
    if (bookings.length > 0) {
      console.log('✅ [DAY PASS WALK-IN API] First booking:', JSON.stringify(bookings[0], null, 2));
      console.log('✅ [DAY PASS WALK-IN API] All booking IDs:', bookings.map(b => b.id));
    } else {
      console.warn('⚠️ [DAY PASS WALK-IN API] No bookings found in database');
      console.log('⚠️ [DAY PASS WALK-IN API] Please verify:');
      console.log('   1. Table exists: SELECT * FROM day_pass_walk_in LIMIT 1;');
      console.log('   2. Data inserted: SELECT COUNT(*) FROM day_pass_walk_in;');
      console.log('   3. Table structure: DESCRIBE day_pass_walk_in;');
    }

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('❌ [DAY PASS WALK-IN API] Database error:', error);
    console.error('❌ [DAY PASS WALK-IN API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch day pass walk-ins',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
