import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Check-in a guest
export const checkInGuest: RequestHandler = async (req, res) => {
  console.log('=== CHECK-IN REQUEST RECEIVED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { bookingId, bookingType, assignedRoom } = req.body;

    if (!bookingId || !bookingType) {
      console.log('❌ ERROR: Missing required fields');
      res.status(400).json({ success: false, message: 'Booking ID and type are required' });
      return;
    }

    // For room bookings, require an assigned room
    if (bookingType === 'room' && !assignedRoom) {
      console.log('❌ ERROR: No room assigned for room check-in');
      res.status(400).json({ success: false, message: 'Please select a room for the guest' });
      return;
    }

    console.log(`📋 Processing check-in for booking ID: ${bookingId}, type: ${bookingType}`);
    
    const connection = await db.getConnection();
    console.log('✅ Database connection established');
    
    await connection.beginTransaction();
    console.log('✅ Transaction started');

    try {
      let tableName = '';
      let roomNumbers = '';
      let userEmail = '';
      let roomName = '';
      let amenityName = '';
      let totalAmount = '';
      let guests = 0;
      let checkInDate = null;
      let checkOutDate = null;

      // Get booking details based on type
      if (bookingType === 'room') {
        tableName = 'room_bookings';
        console.log(`[Check-In] Looking for booking ID: ${bookingId}`);
        
        const [bookings] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );

        if (bookings.length === 0) {
          await connection.rollback();
          connection.release();
          console.log('[Check-In] Error: Booking not found');
          res.status(404).json({ success: false, message: 'Booking not found' });
          return;
        }

        const booking = bookings[0];
        console.log(`[Check-In] Booking found - Status: ${booking.status}, Room: ${booking.room_numbers}`);
        
        if (booking.status !== 'approved') {
          await connection.rollback();
          connection.release();
          console.log('[Check-In] Error: Booking not approved');
          res.status(400).json({ success: false, message: 'Only approved bookings can be checked in' });
          return;
        }

        if (booking.actual_check_in) {
          await connection.rollback();
          connection.release();
          console.log('[Check-In] Error: Already checked in');
          res.status(400).json({ success: false, message: 'Guest is already checked in' });
          return;
        }

        roomNumbers = assignedRoom || booking.room_numbers;
        userEmail = booking.user_email;
        roomName = booking.room_name;
        totalAmount = booking.total_amount;
        guests = booking.guests;
        checkInDate = booking.check_in;
        checkOutDate = booking.check_out;

        console.log('[Check-In] Step 1: Updating booking record with assigned room...');
        // Update booking with actual check-in and assigned room
        await connection.query(
          `UPDATE ${tableName} SET actual_check_in = NOW(), room_status = 'checked_in', room_numbers = ? WHERE id = ?`,
          [roomNumbers, bookingId]
        );

        console.log('[Check-In] Step 2: Updating room status...');
        // Update room status to occupied
        const [updateResult] = await connection.query<ResultSetHeader>(
          `UPDATE room_status SET status = 'occupied', current_booking_id = ?, current_guest_email = ? WHERE room_numbers = ?`,
          [bookingId, userEmail, roomNumbers]
        );
        console.log(`[Check-In] Room status updated, affected rows: ${updateResult.affectedRows}`);

        console.log('[Check-In] Step 3: Creating stay history...');
        // Create/update stay history
        await connection.query(
          `INSERT INTO stay_history (user_id, user_email, booking_id, booking_type, room_name, check_in_date, check_out_date, actual_check_in, guests, total_spent)
           SELECT user_id, user_email, id, 'room', room_name, check_in, check_out, NOW(), guests, CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))
           FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );
        console.log('[Check-In] Stay history created successfully');
      } else if (bookingType === 'amenity') {
        tableName = 'amenity_bookings';
        const [bookings] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );

        if (bookings.length === 0) {
          await connection.rollback();
          connection.release();
          res.status(404).json({ success: false, message: 'Booking not found' });
          return;
        }

        const booking = bookings[0];
        if (booking.status !== 'approved') {
          await connection.rollback();
          connection.release();
          res.status(400).json({ success: false, message: 'Only approved bookings can be checked in' });
          return;
        }

        userEmail = booking.user_email;
        amenityName = booking.amenity_name;
        totalAmount = booking.total_amount;
        guests = booking.guests;

        // Create stay history for amenity
        await connection.query(
          `INSERT INTO stay_history (user_id, user_email, booking_id, booking_type, amenity_name, check_in_date, actual_check_in, guests, total_spent)
           SELECT user_id, user_email, id, 'amenity', amenity_name, booking_date, NOW(), guests, CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))
           FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );
      } else if (bookingType === 'daypass') {
        tableName = 'day_pass_bookings';
        const [bookings] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );

        if (bookings.length === 0) {
          await connection.rollback();
          connection.release();
          res.status(404).json({ success: false, message: 'Booking not found' });
          return;
        }

        const booking = bookings[0];
        if (booking.status !== 'approved') {
          await connection.rollback();
          connection.release();
          res.status(400).json({ success: false, message: 'Only approved bookings can be checked in' });
          return;
        }

        userEmail = booking.user_email;
        totalAmount = booking.total_amount;
        guests = booking.number_of_pax;

        // Create stay history for day pass
        await connection.query(
          `INSERT INTO stay_history (user_id, user_email, booking_id, booking_type, check_in_date, actual_check_in, guests, total_spent)
           SELECT user_id, user_email, id, 'daypass', booking_date, NOW(), number_of_pax, CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))
           FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ 
        success: true, 
        message: 'Guest checked in successfully',
        checkInTime: new Date().toISOString()
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('❌ Transaction error (inner catch):', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  } catch (error) {
    console.error('❌ CHECK-IN ERROR (outer catch):', error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any).code || 'UNKNOWN';
    const sqlMessage = (error as any).sqlMessage || '';
    
    console.error('Error breakdown:', {
      message: errorMessage,
      code: errorCode,
      sqlMessage: sqlMessage
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check in guest',
      error: errorMessage,
      details: sqlMessage || errorCode
    });
  }
};

// Check-out a guest
export const checkOutGuest: RequestHandler = async (req, res) => {
  try {
    const { bookingId, bookingType, notes } = req.body;

    if (!bookingId || !bookingType) {
      res.status(400).json({ success: false, message: 'Booking ID and type are required' });
      return;
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      let tableName = '';
      let roomNumbers = '';

      if (bookingType === 'room') {
        tableName = 'room_bookings';
        const [bookings] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [bookingId]
        );

        if (bookings.length === 0) {
          await connection.rollback();
          connection.release();
          res.status(404).json({ success: false, message: 'Booking not found' });
          return;
        }

        const booking = bookings[0];
        if (!booking.actual_check_in) {
          await connection.rollback();
          connection.release();
          res.status(400).json({ success: false, message: 'Guest must be checked in before check-out' });
          return;
        }

        if (booking.actual_check_out) {
          await connection.rollback();
          connection.release();
          res.status(400).json({ success: false, message: 'Guest is already checked out' });
          return;
        }

        roomNumbers = booking.room_numbers;

        // Update booking with actual check-out
        await connection.query(
          `UPDATE ${tableName} SET actual_check_out = NOW(), room_status = 'checked_out' WHERE id = ?`,
          [bookingId]
        );

        // Update room status to cleaning
        await connection.query(
          `UPDATE room_status SET status = 'cleaning', current_booking_id = NULL, current_guest_email = NULL WHERE room_numbers = ?`,
          [roomNumbers]
        );

        // Update stay history with check-out and calculate nights stayed
        await connection.query(
          `UPDATE stay_history 
           SET actual_check_out = NOW(), 
               nights_stayed = DATEDIFF(NOW(), actual_check_in),
               staff_notes = ?
           WHERE booking_id = ? AND booking_type = 'room'`,
          [notes || null, bookingId]
        );
      } else {
        // For amenity and daypass, just update stay history
        tableName = bookingType === 'amenity' ? 'amenity_bookings' : 'day_pass_bookings';
        
        await connection.query(
          `UPDATE stay_history 
           SET actual_check_out = NOW(),
               staff_notes = ?
           WHERE booking_id = ? AND booking_type = ?`,
          [notes || null, bookingId, bookingType]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ 
        success: true, 
        message: 'Guest checked out successfully',
        checkOutTime: new Date().toISOString()
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out guest' });
  }
};

// Get currently checked-in guests
export const getCurrentlyCheckedIn: RequestHandler = async (req, res) => {
  try {
    const [rooms] = await db.query<RowDataPacket[]>(
      `SELECT rb.*, rs.status as room_current_status, 'room' as booking_type, rb.id as booking_id
       FROM room_bookings rb
       LEFT JOIN room_status rs ON rb.room_numbers = rs.room_numbers
       WHERE rb.actual_check_in IS NOT NULL 
       AND rb.actual_check_out IS NULL
       ORDER BY rb.actual_check_in DESC`
    );

    res.json({ success: true, guests: rooms });
  } catch (error) {
    console.error('Get checked-in guests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch checked-in guests' });
  }
};
