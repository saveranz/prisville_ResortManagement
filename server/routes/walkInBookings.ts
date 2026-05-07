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
      roomNumber,
      contactNumber,
      totalAmount,
      downPayment,
      balance
    } = req.body;

    console.log('📋 Walk-in data:', {
      numberOfPax,
      guestName,
      roomNumber,
      contactNumber,
      totalAmount,
      downPayment,
      balance
    });

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

    console.log('💰 Payment calculation:', {
      totalAmount,
      actualDownPayment,
      calculatedBalance,
      paymentStatus
    });

    // Insert walk-in booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO walk_in_bookings 
      (guest_name, room_number, contact_number, number_of_pax, total_amount, down_payment, balance, payment_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [guestName, roomNumber, contactNumber, numberOfPax, totalAmount, actualDownPayment, calculatedBalance, paymentStatus]
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
