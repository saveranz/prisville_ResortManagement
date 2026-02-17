import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface Booking extends RowDataPacket {
  id: number;
  user_id: number;
  user_email: string;
  room_name: string;
  room_numbers: string;
  check_in: Date;
  check_out: Date;
  guests: number;
  contact_number: string;
  special_requests: string;
  total_amount: string;
  payment_proof: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

// Check room availability for given dates
export const checkRoomAvailability: RequestHandler = async (req, res) => {
  try {
    const { roomNumbers, checkIn, checkOut } = req.query;

    if (!roomNumbers || !checkIn || !checkOut) {
      res.status(400).json({ 
        success: false, 
        message: 'Room numbers, check-in and check-out dates are required' 
      });
      return;
    }

    // Check for overlapping bookings that are approved or pending
    const [overlappingBookings] = await db.query<Booking[]>(
      `SELECT id FROM room_bookings 
      WHERE room_numbers = ? 
      AND status IN ('approved', 'pending')
      AND (
        (check_in <= ? AND check_out > ?) OR
        (check_in < ? AND check_out >= ?) OR
        (check_in >= ? AND check_out <= ?)
      )`,
      [roomNumbers, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]
    );

    const isAvailable = overlappingBookings.length === 0;

    res.json({ 
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Room is available' : 'Room is not available for selected dates'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a room booking
export const createRoomBooking: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to make a booking' 
      });
      return;
    }

    const {
      roomName,
      roomType,
      roomNumbers,
      checkIn,
      checkOut,
      guests,
      contactNumber,
      specialRequests,
      totalAmount,
      paymentProof,
    } = req.body;

    // Validate required fields
    if (!roomName || !roomNumbers || !checkIn || !checkOut || !guests || !contactNumber || !totalAmount || !paymentProof) {
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    // Check room availability
    const [overlappingBookings] = await db.query<Booking[]>(
      `SELECT id FROM room_bookings 
      WHERE room_numbers = ? 
      AND status IN ('approved', 'pending')
      AND (
        (check_in <= ? AND check_out > ?) OR
        (check_in < ? AND check_out >= ?) OR
        (check_in >= ? AND check_out <= ?)
      )`,
      [roomNumbers, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]
    );

    if (overlappingBookings.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Room is not available for the selected dates. Please choose different dates.' 
      });
      return;
    }

    // Insert booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO room_bookings 
      (user_id, user_email, room_name, room_type, room_numbers, check_in, check_out, guests, contact_number, special_requests, total_amount, payment_proof, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.session.userId,
        req.session.userEmail,
        roomName,
        roomType || null,
        roomNumbers,
        checkIn,
        checkOut,
        guests,
        contactNumber,
        specialRequests || null,
        totalAmount,
        paymentProof,
      ]
    );

    res.json({ 
      success: true, 
      message: 'Booking submitted successfully! Waiting for approval.',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create room booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user's room bookings
export const getUserRoomBookings: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to view bookings' 
      });
      return;
    }

    const [bookings] = await db.query<Booking[]>(
      `SELECT id, room_name, room_numbers, check_in, check_out, guests, contact_number, 
      special_requests, total_amount, status, created_at 
      FROM room_bookings 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [req.session.userId]
    );

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('Get room bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all room bookings (admin only)
export const getAllRoomBookings: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in and is admin
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to view bookings' 
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

    const [bookings] = await db.query<Booking[]>(
      `SELECT * FROM room_bookings ORDER BY created_at DESC`
    );

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('Get all room bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update booking status (admin only)
export const updateBookingStatus: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in and is admin
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

    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      res.status(400).json({ 
        success: false, 
        message: 'Booking ID and status are required' 
      });
      return;
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
      return;
    }

    await db.query(
      'UPDATE room_bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    res.json({ 
      success: true, 
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update booking status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
