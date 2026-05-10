import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Clear test bookings from room_bookings and day_pass_bookings tables
export const clearTestBookings: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
      return;
    }

    // Clear room bookings (IDs 1-4)
    const [roomResult] = await db.query(
      'DELETE FROM room_bookings WHERE id IN (1, 2, 3, 4)'
    );

    // Clear day pass bookings (IDs 1-2)
    const [dayPassResult] = await db.query(
      'DELETE FROM day_pass_bookings WHERE id IN (1, 2)'
    );

    // Get counts
    const [roomCount] = await db.query('SELECT COUNT(*) as count FROM room_bookings');
    const [dayPassCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_bookings');

    res.json({ 
      success: true, 
      message: 'Test bookings cleared successfully',
      deleted: {
        roomBookings: (roomResult as any).affectedRows,
        dayPassBookings: (dayPassResult as any).affectedRows
      },
      remaining: {
        roomBookings: (roomCount as any)[0].count,
        dayPassBookings: (dayPassCount as any)[0].count
      }
    });
  } catch (error) {
    console.error('Clear test bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear test bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
