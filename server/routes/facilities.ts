import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const VALID_ROOM_TYPES = [
  'Standard Room (Aircon)',
  'Non-Aircon Room',
  'Family Fan Room',
  'Large Family Room'
] as const;

const normalizePrice = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('₱') ? trimmed : `₱${trimmed}`;
};

const parseCapacity = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  return NaN;
};

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

// Create new room (admin only)
export const createRoom: RequestHandler = async (req, res) => {
  try {
    const {
      room_name,
      room_type,
      room_numbers,
      capacity,
      price_per_night,
      amenities,
      description,
      special_requests,
      is_active
    } = req.body;

    const parsedCapacity = parseCapacity(capacity);

    if (!room_name || !room_type || !room_numbers || !price_per_night || Number.isNaN(parsedCapacity)) {
      res.status(400).json({
        success: false,
        message: 'room_name, room_type, room_numbers, capacity, and price_per_night are required'
      });
      return;
    }

    if (!VALID_ROOM_TYPES.includes(room_type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room_type value'
      });
      return;
    }

    if (parsedCapacity <= 0) {
      res.status(400).json({
        success: false,
        message: 'capacity must be greater than 0'
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO rooms (
        room_name, room_type, room_numbers, capacity, price_per_night, amenities, description, special_requests, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(room_name).trim(),
        room_type,
        String(room_numbers).trim(),
        parsedCapacity,
        normalizePrice(String(price_per_night)),
        amenities ? String(amenities).trim() : null,
        description ? String(description).trim() : null,
        special_requests ? String(special_requests).trim() : null,
        is_active === false ? false : true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      roomId: result.insertId
    });
  } catch (error) {
    console.error('❌ Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

// Update room (admin only)
export const updateRoom: RequestHandler = async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomIdParam = Array.isArray(roomId) ? roomId[0] : roomId;
    const {
      room_name,
      room_type,
      room_numbers,
      capacity,
      price_per_night,
      amenities,
      description,
      special_requests,
      is_active
    } = req.body;

    const parsedCapacity = parseCapacity(capacity);

    if (!roomIdParam || Number.isNaN(parseInt(roomIdParam, 10))) {
      res.status(400).json({ success: false, message: 'Invalid roomId' });
      return;
    }

    const parsedRoomId = parseInt(roomIdParam, 10);

    if (!room_name || !room_type || !room_numbers || !price_per_night || Number.isNaN(parsedCapacity)) {
      res.status(400).json({
        success: false,
        message: 'room_name, room_type, room_numbers, capacity, and price_per_night are required'
      });
      return;
    }

    if (!VALID_ROOM_TYPES.includes(room_type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room_type value'
      });
      return;
    }

    if (parsedCapacity <= 0) {
      res.status(400).json({
        success: false,
        message: 'capacity must be greater than 0'
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE rooms
       SET room_name = ?, room_type = ?, room_numbers = ?, capacity = ?, price_per_night = ?,
           amenities = ?, description = ?, special_requests = ?, is_active = ?
       WHERE id = ?`,
      [
        String(room_name).trim(),
        room_type,
        String(room_numbers).trim(),
        parsedCapacity,
        normalizePrice(String(price_per_night)),
        amenities ? String(amenities).trim() : null,
        description ? String(description).trim() : null,
        special_requests ? String(special_requests).trim() : null,
        is_active === false ? false : true,
        parsedRoomId
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room'
    });
  }
};

// Soft delete room (admin only)
export const deleteRoom: RequestHandler = async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomIdParam = Array.isArray(roomId) ? roomId[0] : roomId;

    if (!roomIdParam || Number.isNaN(parseInt(roomIdParam, 10))) {
      res.status(400).json({ success: false, message: 'Invalid roomId' });
      return;
    }

    const parsedRoomId = parseInt(roomIdParam, 10);

    const [result] = await db.query<ResultSetHeader>(
      'UPDATE rooms SET is_active = FALSE WHERE id = ?',
      [parsedRoomId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
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

  // Get extra items for a room
  export const getRoomExtraItems: RequestHandler = async (req, res) => {
    try {
      const { roomId } = req.params;
      const roomIdParam = Array.isArray(roomId) ? roomId[0] : roomId;

      if (!roomIdParam || Number.isNaN(parseInt(roomIdParam, 10))) {
        res.status(400).json({ success: false, message: 'Invalid roomId' });
        return;
      }

      const connection = await db.getConnection();

      try {
        const [items] = await connection.query<RowDataPacket[]>(
          `SELECT id, item_name, price, unit, description, is_active 
           FROM room_extra_items 
           WHERE room_id = ? 
           ORDER BY item_name ASC`,
          [parseInt(roomIdParam, 10)]
        );

        connection.release();

        res.json({
          success: true,
          items: items || []
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('❌ Error fetching room extra items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room extra items'
      });
    }
  };

  // Add extra item to a room
  export const addRoomExtraItem: RequestHandler = async (req, res) => {
    try {
      const { roomId } = req.params;
      const { item_name, price, unit, description } = req.body;
      const roomIdParam = Array.isArray(roomId) ? roomId[0] : roomId;

      if (!roomIdParam || Number.isNaN(parseInt(roomIdParam, 10))) {
        res.status(400).json({ success: false, message: 'Invalid roomId' });
        return;
      }

      if (!item_name || !price) {
        res.status(400).json({ success: false, message: 'Item name and price are required' });
        return;
      }

      const connection = await db.getConnection();

      try {
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO room_extra_items (room_id, item_name, price, unit, description, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            parseInt(roomIdParam, 10),
            String(item_name).trim(),
            normalizePrice(String(price)),
            unit ? String(unit).trim() : null,
            description ? String(description).trim() : null,
            true
          ]
        );

        connection.release();

        res.status(201).json({
          success: true,
          message: 'Extra item added successfully',
          itemId: result.insertId
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('❌ Error adding room extra item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add room extra item'
      });
    }
  };

  // Update extra item
  export const updateRoomExtraItem: RequestHandler = async (req, res) => {
    try {
      const { roomId, itemId } = req.params;
      const { item_name, price, unit, description, is_active } = req.body;
      const itemIdParam = Array.isArray(itemId) ? itemId[0] : itemId;

      if (!itemIdParam || Number.isNaN(parseInt(itemIdParam, 10))) {
        res.status(400).json({ success: false, message: 'Invalid itemId' });
        return;
      }

      if (!item_name || !price) {
        res.status(400).json({ success: false, message: 'Item name and price are required' });
        return;
      }

      const connection = await db.getConnection();

      try {
        const [result] = await connection.query<ResultSetHeader>(
          `UPDATE room_extra_items 
           SET item_name = ?, price = ?, unit = ?, description = ?, is_active = ?
           WHERE id = ?`,
          [
            String(item_name).trim(),
            normalizePrice(String(price)),
            unit ? String(unit).trim() : null,
            description ? String(description).trim() : null,
            is_active === false ? false : true,
            parseInt(itemIdParam, 10)
          ]
        );

        connection.release();

        if (result.affectedRows === 0) {
          res.status(404).json({ success: false, message: 'Extra item not found' });
          return;
        }

        res.json({
          success: true,
          message: 'Extra item updated successfully'
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('❌ Error updating room extra item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update room extra item'
      });
    }
  };

  // Delete extra item
  export const deleteRoomExtraItem: RequestHandler = async (req, res) => {
    try {
      const { roomId, itemId } = req.params;
      const itemIdParam = Array.isArray(itemId) ? itemId[0] : itemId;

      if (!itemIdParam || Number.isNaN(parseInt(itemIdParam, 10))) {
        res.status(400).json({ success: false, message: 'Invalid itemId' });
        return;
      }

      const connection = await db.getConnection();

      try {
        const [result] = await connection.query<ResultSetHeader>(
          `DELETE FROM room_extra_items WHERE id = ?`,
          [parseInt(itemIdParam, 10)]
        );

        connection.release();

        if (result.affectedRows === 0) {
          res.status(404).json({ success: false, message: 'Extra item not found' });
          return;
        }

        res.json({
          success: true,
          message: 'Extra item deleted successfully'
        });
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('❌ Error deleting room extra item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete room extra item'
      });
    }
  };
