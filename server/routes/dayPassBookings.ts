import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { sendNotificationToUser } from "./notifications";

// Check day pass availability
export const checkDayPassAvailability: RequestHandler = async (req, res) => {
  try {
    const { bookingDate } = req.query;

    if (!bookingDate) {
      return res.json({ success: false, message: "Booking date is required" });
    }

    // Check if there are any bookings for this date
    // Note: You can add capacity limits here if needed
    const [bookings] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM day_pass_bookings 
       WHERE booking_date = ? AND status != 'rejected'`,
      [bookingDate]
    );

    const count = bookings[0].count;
    const maxCapacity = 100; // Set your max day pass capacity

    const available = count < maxCapacity;

    return res.json({
      success: true,
      available,
      message: available
        ? "Day pass available for this date"
        : "Day pass fully booked for this date",
      currentBookings: count,
      maxCapacity
    });
  } catch (error) {
    console.error("Error checking day pass availability:", error);
    return res.json({ success: false, message: "Failed to check availability" });
  }
};

// Create day pass booking
export const createDayPassBooking: RequestHandler = async (req, res) => {
  try {
    console.log("Day pass booking request - Session:", req.session);
    console.log("Day pass booking request - Body:", {
      ...req.body,
      paymentProof: req.body.paymentProof ? `[${req.body.paymentProof.length} chars]` : 'missing'
    });

    if (!req.session.userId) {
      console.error("Authentication failed - No userId in session");
      return res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
    }

    const {
      bookingDate,
      numberOfPax,
      contactNumber,
      specialRequests,
      totalAmount,
      paymentProof,
      guests,
    } = req.body;

    // Validate required fields
    if (!bookingDate || !numberOfPax || !contactNumber || !totalAmount || !paymentProof) {
      const missingFields = [];
      if (!bookingDate) missingFields.push('bookingDate');
      if (!numberOfPax) missingFields.push('numberOfPax');
      if (!contactNumber) missingFields.push('contactNumber');
      if (!totalAmount) missingFields.push('totalAmount');
      if (!paymentProof) missingFields.push('paymentProof');
      console.error("Missing required fields:", missingFields);
      return res.json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Check availability one more time before inserting
    const [existingBookings] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM day_pass_bookings 
       WHERE booking_date = ? AND status != 'rejected'`,
      [bookingDate]
    );

    const count = existingBookings[0].count;
    const maxCapacity = 100;

    if (count >= maxCapacity) {
      return res.json({
        success: false,
        message: "Sorry, day pass is fully booked for this date"
      });
    }

    // Insert the booking
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO day_pass_bookings 
       (user_id, user_email, booking_date, number_of_pax, contact_number, 
        special_requests, total_amount, payment_proof, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.session.userId,
        req.session.userEmail,
        bookingDate,
        numberOfPax,
        contactNumber,
        specialRequests || null,
        totalAmount,
        paymentProof,
      ]
    );

    const bookingId = result.insertId;

    // Insert guests if provided
    if (guests && Array.isArray(guests) && guests.length > 0) {
      for (const guest of guests) {
        if (guest.name) {
          await db.query(
            `INSERT INTO day_pass_guests (booking_id, guest_name, age, gender) 
             VALUES (?, ?, ?, ?)`,
            [
              bookingId,
              guest.name,
              guest.age || null,
              guest.gender || null,
            ]
          );
        }
      }
    }

    return res.json({
      success: true,
      message: "Day pass booking submitted successfully",
      bookingId: bookingId,
    });
  } catch (error) {
    console.error("Error creating day pass booking:", error);
    return res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// Get user's day pass bookings
export const getUserDayPassBookings: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const [bookings] = await db.query<RowDataPacket[]>(
      `SELECT * FROM day_pass_bookings 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    // Fetch guests for each booking
    for (const booking of bookings) {
      const [guests] = await db.query<RowDataPacket[]>(
        `SELECT guest_name, age, gender FROM day_pass_guests 
         WHERE booking_id = ? 
         ORDER BY id`,
        [booking.id]
      );
      booking.guests = guests;
    }

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching day pass bookings:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// Get all day pass bookings (admin)
export const getAllDayPassBookings: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // TODO: Add role check for admin
    // if (req.session.userRole !== 'admin') {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

    const [bookings] = await db.query<RowDataPacket[]>(
      `SELECT * FROM day_pass_bookings ORDER BY created_at DESC`
    );

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching all day pass bookings:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// Update day pass booking status
export const updateDayPassBookingStatus: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // TODO: Add role check for admin
    // if (req.session.userRole !== 'admin') {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    // Get booking details before updating
    const [bookings] = await db.query<DayPassBooking[]>(
      'SELECT user_id, booking_date, number_of_pax FROM day_pass_bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    await db.query(
      `UPDATE day_pass_bookings SET status = ? WHERE id = ?`,
      [status, bookingId]
    );

    // Send notification to user
    const notificationTitles = {
      approved: 'Day Pass Booking Approved',
      rejected: 'Day Pass Booking Rejected',
      pending: 'Day Pass Booking Under Review'
    };

    const notificationMessages = {
      approved: `Great news! Your day pass booking for ${booking.number_of_pax} guest(s) has been approved.`,
      rejected: `Unfortunately, your day pass booking has been rejected. Please contact us for more information.`,
      pending: `Your day pass booking is now under review.`
    };

    await sendNotificationToUser(
      booking.user_id,
      'booking',
      notificationTitles[status as keyof typeof notificationTitles],
      notificationMessages[status as keyof typeof notificationMessages],
      {
        relatedBookingId: bookingId,
        relatedBookingType: 'day_pass',
        priority: status === 'approved' ? 'high' : 'normal'
      }
    );

    return res.json({ success: true, message: "Booking status updated" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
