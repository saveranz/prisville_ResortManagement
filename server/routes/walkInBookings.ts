import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface WalkInBooking extends RowDataPacket {
  id: number;
  guest_name: string;
  address: string;
  contact_number: string;
  number_of_pax: number;
  amount: string;
  created_at: Date;
  updated_at: Date;
}

// Create a walk-in booking (receptionist only)
export const createWalkInBooking: RequestHandler = async (req, res) => {
  try {
    console.log('📝 Walk-in booking request received');
    
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
      numberOfPax,
      guestName,
      address,
      contactNumber,
      amount
    } = req.body;

    console.log('📋 Walk-in data:', {
      numberOfPax,
      guestName,
      address,
      contactNumber,
      amount
    });

    // Validate required fields
    if (!numberOfPax || !guestName || !address || !contactNumber || !amount) {
      res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
      return;
    }

    // Insert walk-in booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO walk_in_bookings 
      (guest_name, address, contact_number, number_of_pax, amount) 
      VALUES (?, ?, ?, ?, ?)`,
      [guestName, address, contactNumber, numberOfPax, amount]
    );

    console.log('✅ Walk-in recorded successfully with ID:', result.insertId);

    res.json({ 
      success: true, 
      message: 'Walk-in recorded successfully!',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('❌ Create walk-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record walk-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all walk-in bookings (receptionist only)
export const getAllWalkInBookings: RequestHandler = async (req, res) => {
  try {
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

    const [bookings] = await db.query<WalkInBooking[]>(
      `SELECT * FROM walk_in_bookings ORDER BY created_at DESC`
    );

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('Get walk-in bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch walk-in bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
