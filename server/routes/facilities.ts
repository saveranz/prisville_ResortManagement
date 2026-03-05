import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

// Get all unique rooms
export const getAllRooms: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      // Get rooms from master table with booking statistics
      const [rooms] = await connection.query<RowDataPacket[]>(
        `SELECT 
          r.id,
          r.room_name,
          r.room_type,
          r.room_numbers,
          r.capacity,
          r.price_per_night,
          r.amenities,
          r.description,
          r.is_active,
          COALESCE(COUNT(rb.id), 0) as total_bookings,
          COALESCE(SUM(CASE WHEN rb.status = 'approved' THEN 1 ELSE 0 END), 0) as approved_bookings,
          MAX(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN 1 ELSE 0 END) as is_occupied
        FROM rooms r
        LEFT JOIN room_bookings rb ON r.room_name = rb.room_name
        WHERE r.is_active = TRUE
        GROUP BY r.id, r.room_name, r.room_type, r.room_numbers, r.capacity, r.price_per_night, r.amenities, r.description, r.is_active
        ORDER BY r.room_name`
      );

      connection.release();

      res.json({
        success: true,
        rooms
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch rooms' 
    });
  }
};

// Get all unique amenities
export const getAllAmenities: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      // Get amenities from master table with booking statistics
      const [amenities] = await connection.query<RowDataPacket[]>(
        `SELECT 
          a.id,
          a.amenity_name,
          a.amenity_type,
          a.capacity,
          a.price_per_pax,
          a.base_price,
          a.operating_hours,
          a.features,
          a.description,
          a.is_active,
          COALESCE(COUNT(ab.id), 0) as total_bookings,
          COALESCE(SUM(CASE WHEN ab.status = 'approved' THEN 1 ELSE 0 END), 0) as approved_bookings
        FROM amenities a
        LEFT JOIN amenity_bookings ab ON a.amenity_name = ab.amenity_name
        WHERE a.is_active = TRUE
        GROUP BY a.id, a.amenity_name, a.amenity_type, a.capacity, a.price_per_pax, a.base_price, a.operating_hours, a.features, a.description, a.is_active
        ORDER BY a.amenity_name`
      );

      connection.release();

      res.json({
        success: true,
        amenities
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching amenities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch amenities' 
    });
  }
};

// Get day pass statistics
export const getDayPassStats: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [stats] = await connection.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_bookings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(CASE WHEN status = 'approved' THEN CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2)) ELSE 0 END) as total_revenue
        FROM day_pass_bookings`
      );

      // Get bookings by date
      const [bookingsByDate] = await connection.query<RowDataPacket[]>(
        `SELECT 
          booking_date,
          COUNT(*) as bookings,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM day_pass_bookings
        GROUP BY booking_date
        ORDER BY booking_date DESC
        LIMIT 30`
      );

      connection.release();

      res.json({
        success: true,
        stats: stats[0],
        bookingsByDate
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching day pass stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch day pass statistics' 
    });
  }
};

// Get room availability calendar
export const getRoomAvailabilityCalendar: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const connection = await db.getConnection();

    try {
      let query = `
        SELECT 
          room_name,
          check_in,
          check_out,
          status,
          user_email,
          actual_check_in,
          actual_check_out
        FROM room_bookings
        WHERE status IN ('approved', 'pending')
      `;

      const params: any[] = [];

      if (startDate) {
        query += ` AND check_in >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND check_out <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY room_name, check_in`;

      const [bookings] = await connection.query<RowDataPacket[]>(query, params);

      connection.release();

      // Group by room
      const roomsMap = new Map();
      
      bookings.forEach((booking: any) => {
        if (!roomsMap.has(booking.room_name)) {
          roomsMap.set(booking.room_name, []);
        }
        roomsMap.get(booking.room_name).push(booking);
      });

      const calendar = Array.from(roomsMap.entries()).map(([roomName, bookings]) => ({
        roomName,
        bookings
      }));

      res.json({
        success: true,
        calendar
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching room availability calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch room availability calendar' 
    });
  }
};
