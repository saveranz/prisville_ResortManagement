import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface AmenityBooking extends RowDataPacket {
  id: number;
  user_id: number;
  user_email: string;
  amenity_name: string;
  amenity_type: string;
  booking_date: Date;
  start_time: string;
  end_time: string;
  guests: number;
  contact_number: string;
  event_details: string;
  total_amount: string;
  payment_proof: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

// Check amenity availability for given date and time
export const checkAmenityAvailability: RequestHandler = async (req, res) => {
  try {
    const { amenityType, bookingDate, startTime, endTime } = req.query;

    if (!amenityType || !bookingDate || !startTime || !endTime) {
      res.status(400).json({ 
        success: false, 
        message: 'Amenity type, booking date, start time and end time are required' 
      });
      return;
    }

    // Check for overlapping bookings that are approved or pending
    const [overlappingBookings] = await db.query<AmenityBooking[]>(
      `SELECT id FROM amenity_bookings 
      WHERE amenity_type = ? 
      AND booking_date = ?
      AND status IN ('approved', 'pending')
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )`,
      [amenityType, bookingDate, endTime, startTime, endTime, startTime, startTime, endTime]
    );

    const isAvailable = overlappingBookings.length === 0;

    res.json({ 
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Amenity is available' : 'Amenity is not available for selected date and time'
    });
  } catch (error) {
    console.error('Check amenity availability error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create an amenity booking
export const createAmenityBooking: RequestHandler = async (req, res) => {
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
      amenityName,
      amenityType,
      bookingDate,
      startTime,
      endTime,
      guests,
      contactNumber,
      eventDetails,
      totalAmount,
      paymentProof,
    } = req.body;

    // Validate required fields
    if (!amenityName || !amenityType || !bookingDate || !startTime || !endTime || !guests || !contactNumber || !totalAmount || !paymentProof) {
      res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
      return;
    }

    // Check amenity availability
    const [overlappingBookings] = await db.query<AmenityBooking[]>(
      `SELECT id FROM amenity_bookings 
      WHERE amenity_type = ? 
      AND booking_date = ?
      AND status IN ('approved', 'pending')
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )`,
      [amenityType, bookingDate, endTime, startTime, endTime, startTime, startTime, endTime]
    );

    if (overlappingBookings.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Amenity is not available for the selected date and time. Please choose different time slot.' 
      });
      return;
    }

    // Insert booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO amenity_bookings 
      (user_id, user_email, amenity_name, amenity_type, booking_date, start_time, end_time, guests, contact_number, event_details, total_amount, payment_proof, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.session.userId,
        req.session.userEmail,
        amenityName,
        amenityType,
        bookingDate,
        startTime,
        endTime,
        guests,
        contactNumber,
        eventDetails || null,
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
    console.error('Create amenity booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user's amenity bookings
export const getUserAmenityBookings: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to view bookings' 
      });
      return;
    }

    const [bookings] = await db.query<AmenityBooking[]>(
      `SELECT id, amenity_name, amenity_type, booking_date, start_time, end_time, guests, contact_number, 
      event_details, total_amount, status, created_at 
      FROM amenity_bookings 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [req.session.userId]
    );

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('Get amenity bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all amenity bookings (admin only)
export const getAllAmenityBookings: RequestHandler = async (req, res) => {
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

    const [bookings] = await db.query<AmenityBooking[]>(
      `SELECT * FROM amenity_bookings ORDER BY created_at DESC`
    );

    res.json({ 
      success: true, 
      bookings
    });
  } catch (error) {
    console.error('Get all amenity bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update amenity booking status (admin only)
export const updateAmenityBookingStatus: RequestHandler = async (req, res) => {
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
      'UPDATE amenity_bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    res.json({ 
      success: true, 
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Update amenity booking status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update booking status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
