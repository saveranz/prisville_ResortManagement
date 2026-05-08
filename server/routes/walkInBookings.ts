import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface WalkInBooking extends RowDataPacket {
  id: number;
  guest_name: string;
  room_number: string;
  contact_number: string;
  number_of_pax: number;
  total_amount: string;
  down_payment: string;
  balance: string;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
}

// Create a walk-in booking (receptionist only)
export const createWalkInBooking: RequestHandler = async (req, res) => {
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

    const {
      numberOfPax,
      guestName,
      roomNumber,
      contactNumber,
      totalAmount,
      downPayment,
      balance
    } = req.body;

    // Validate required fields
    if (!numberOfPax || !guestName || !roomNumber || !contactNumber || !totalAmount) {
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    // If downPayment is empty or not provided, assume full payment
    const actualDownPayment = downPayment && downPayment !== '' ? parseFloat(downPayment) : parseFloat(totalAmount);
    
    // Calculate balance and payment status
    const calculatedBalance = parseFloat(totalAmount) - actualDownPayment;
    const paymentStatus = calculatedBalance <= 0 ? 'paid' : 'partial';
    
    // For display: if full payment, show 0 for down_payment
    const displayDownPayment = calculatedBalance <= 0 ? 0 : actualDownPayment;

    // Insert walk-in booking (including legacy fields for backward compatibility)
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO walk_in_bookings 
      (guest_name, room_number, contact_number, number_of_pax, address, amount, total_amount, down_payment, balance, payment_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [guestName, roomNumber, contactNumber, numberOfPax, '', totalAmount, totalAmount, displayDownPayment, calculatedBalance, paymentStatus]
    );

    res.json({ 
      success: true, 
      message: 'Walk-in recorded successfully!',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create walk-in error:', error);
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

    // Check if archived column exists, if not, just get all records
    const [bookings] = await db.query<WalkInBooking[]>(
      `SELECT * FROM walk_in_bookings 
       WHERE (archived IS NULL OR archived = FALSE OR archived = 0)
       ORDER BY created_at DESC`
    );

    console.log('[Walk-In API] Fetched bookings count:', bookings.length);
    console.log('[Walk-In API] Sample booking:', bookings[0]);

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

// Update a walk-in booking (receptionist only)
export const updateWalkInBooking: RequestHandler = async (req, res) => {
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

    const { id } = req.params;
    const {
      numberOfPax,
      guestName,
      roomNumber,
      contactNumber,
      totalAmount,
      downPayment,
      balance
    } = req.body;

    // Validate required fields
    if (!numberOfPax || !guestName || !roomNumber || !contactNumber || !totalAmount) {
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    // If downPayment is empty or not provided, assume full payment
    const actualDownPayment = downPayment && downPayment !== '' ? parseFloat(downPayment) : parseFloat(totalAmount);
    
    // Calculate balance and payment status
    const calculatedBalance = parseFloat(totalAmount) - actualDownPayment;
    const paymentStatus = calculatedBalance <= 0 ? 'paid' : 'partial';
    
    // For display: if full payment, show 0 for down_payment
    const displayDownPayment = calculatedBalance <= 0 ? 0 : actualDownPayment;

    // Update walk-in booking (including legacy fields for backward compatibility)
    await db.query(
      `UPDATE walk_in_bookings 
      SET guest_name = ?, room_number = ?, contact_number = ?, number_of_pax = ?, 
          address = ?, amount = ?, total_amount = ?, down_payment = ?, balance = ?, payment_status = ?
      WHERE id = ?`,
      [guestName, roomNumber, contactNumber, numberOfPax, '', totalAmount, totalAmount, displayDownPayment, calculatedBalance, paymentStatus, id]
    );

    res.json({ 
      success: true, 
      message: 'Walk-in updated successfully!'
    });
  } catch (error) {
    console.error('Update walk-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update walk-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Archive a walk-in booking (receptionist only)
export const archiveWalkInBooking: RequestHandler = async (req, res) => {
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

    const { id } = req.params;

    // Try to archive walk-in booking (soft delete)
    // If archived column doesn't exist, the error will be caught
    try {
      await db.query(
        `UPDATE walk_in_bookings SET archived = TRUE WHERE id = ?`,
        [id]
      );
    } catch (dbError: any) {
      // If column doesn't exist, add it first then try again
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(`ALTER TABLE walk_in_bookings ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE`);
        await db.query(`UPDATE walk_in_bookings SET archived = TRUE WHERE id = ?`, [id]);
      } else {
        throw dbError;
      }
    }

    res.json({ 
      success: true, 
      message: 'Walk-in archived successfully!'
    });
  } catch (error) {
    console.error('Archive walk-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to archive walk-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
