import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendNotificationToUser } from "./notifications";

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
  actual_check_in: Date | null;
  actual_check_out: Date | null;
  room_status: string;
  created_at: Date;
  updated_at: Date;
}

// Get unavailable date ranges for a room
export const getUnavailableDates: RequestHandler = async (req, res) => {
  try {
    const { roomNumbers } = req.query;

    console.log('🔍 Fetching unavailable dates for room:', roomNumbers);

    if (!roomNumbers) {
      res.status(400).json({ 
        success: false, 
        message: 'Room numbers are required' 
      });
      return;
    }

    // Get all approved bookings and checked-in guests for this room
    const [bookings] = await db.query<Booking[]>(
      `SELECT check_in as checkIn, check_out as checkOut, status FROM room_bookings 
      WHERE room_numbers = ? 
      AND (
        status = 'approved' 
        OR (actual_check_in IS NOT NULL AND actual_check_out IS NULL)
      )
      ORDER BY check_in ASC`,
      [roomNumbers]
    );

    console.log(`📅 Found ${bookings.length} unavailable date ranges:`, bookings);

    res.json({ 
      success: true,
      unavailableDates: bookings
    });
  } catch (error) {
    console.error('Get unavailable dates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unavailable dates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

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

    // Check for overlapping bookings that are approved or checked-in
    // A room is unavailable if:
    // 1. It has an APPROVED booking for these dates, OR
    // 2. It has a checked-in guest (actual_check_in is set and actual_check_out is NULL)
    // Note: Pending bookings do NOT block dates until approved
    const [overlappingBookings] = await db.query<Booking[]>(
      `SELECT id FROM room_bookings 
      WHERE room_numbers = ? 
      AND (
        (status = 'approved' AND (
          (check_in <= ? AND check_out > ?) OR
          (check_in < ? AND check_out >= ?) OR
          (check_in >= ? AND check_out <= ?)
        ))
        OR 
        (actual_check_in IS NOT NULL AND actual_check_out IS NULL AND (
          (check_in <= ? AND check_out > ?) OR
          (check_in < ? AND check_out >= ?) OR
          (check_in >= ? AND check_out <= ?)
        ))
      )`,
      [roomNumbers, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut, 
       checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]
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
    console.log('📝 Room booking request received');
    console.log('Session data:', { userId: req.session.userId, userEmail: req.session.userEmail });
    
    // Check if user is logged in
    if (!req.session.userId) {
      console.log('❌ Unauthorized: No userId in session');
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
      extraItems,
      totalAmount,
      paymentProof,
    } = req.body;

    console.log('📋 Booking data:', {
      roomName,
      roomType,
      roomNumbers,
      checkIn,
      checkOut,
      guests,
      contactNumber,
      extraItems: extraItems?.length || 0,
      totalAmount,
      paymentProofLength: paymentProof?.length || 0
    });

    // Validate required fields
    if (!roomName || !roomNumbers || !checkIn || !checkOut || !guests || !contactNumber || !totalAmount || !paymentProof) {
      console.log('❌ Validation failed: Missing required fields');
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    console.log('🔍 Checking room availability...');
    console.log('Query params:', { roomNumbers, checkIn, checkOut });
    
    // Check room availability - exclude APPROVED bookings AND checked-in guests
    // Pending bookings do NOT block dates until they are approved
    const [overlappingBookings] = await db.query<Booking[]>(
      `SELECT id, room_numbers, check_in, check_out, status FROM room_bookings 
      WHERE room_numbers = ? 
      AND (
        (status = 'approved' AND (
          (check_in <= ? AND check_out > ?) OR
          (check_in < ? AND check_out >= ?) OR
          (check_in >= ? AND check_out <= ?)
        ))
        OR 
        (actual_check_in IS NOT NULL AND actual_check_out IS NULL AND (
          (check_in <= ? AND check_out > ?) OR
          (check_in < ? AND check_out >= ?) OR
          (check_in >= ? AND check_out <= ?)
        ))
      )`,
      [roomNumbers, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut, 
       checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]
    );

    console.log(`Found ${overlappingBookings.length} overlapping bookings:`, overlappingBookings);

    if (overlappingBookings.length > 0) {
      console.log('❌ Room not available for selected dates');
      res.status(400).json({ 
        success: false, 
        message: 'Room is not available for the selected dates. Please choose different dates.' 
      });
      return;
    }

    console.log('💾 Inserting booking into database...');
    // Insert booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO room_bookings 
      (user_id, user_email, room_name, room_type, room_numbers, check_in, check_out, guests, contact_number, special_requests, extra_items, total_amount, payment_proof, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
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
        extraItems && extraItems.length > 0 ? JSON.stringify(extraItems) : null,
        totalAmount,
        paymentProof,
      ]
    );

    console.log('✅ Booking created successfully with ID:', result.insertId);

    res.json({ 
      success: true, 
      message: 'Booking submitted successfully! Waiting for approval.',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('❌ Create room booking error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any).code,
      errno: (error as any).errno,
      sqlMessage: (error as any).sqlMessage
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: (error as any).sqlMessage || undefined
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
      `SELECT rb.*, u.name as guest_name FROM room_bookings rb LEFT JOIN users u ON rb.user_id = u.id ORDER BY rb.created_at DESC`
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

    // Get booking details before updating
    const [bookings] = await db.query<Booking[]>(
      'SELECT user_id, room_name, check_in FROM room_bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
      return;
    }

    const booking = bookings[0];

    // Update booking status
    await db.query(
      'UPDATE room_bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    // Send notification to user
    const notificationTitles = {
      approved: 'Booking Approved',
      rejected: 'Booking Rejected',
      pending: 'Booking Under Review'
    };

    const notificationMessages = {
      approved: `Great news! Your room booking for ${booking.room_name} has been approved.`,
      rejected: `Unfortunately, your room booking for ${booking.room_name} has been rejected. Please contact us for more information.`,
      pending: `Your room booking for ${booking.room_name} is now under review.`
    };

    await sendNotificationToUser(
      booking.user_id,
      'booking',
      notificationTitles[status as keyof typeof notificationTitles],
      notificationMessages[status as keyof typeof notificationMessages],
      {
        relatedBookingId: bookingId,
        relatedBookingType: 'room',
        priority: status === 'approved' ? 'high' : 'normal'
      }
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
