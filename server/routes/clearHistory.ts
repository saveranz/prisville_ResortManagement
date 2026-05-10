import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Clear history records
export const clearHistory: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    const { type } = req.body; // 'room', 'walkin', 'daypass', or 'all'

    let deletedCounts: any = {};

    if (type === 'room' || type === 'all') {
      // Delete room bookings from stay_history
      const [roomResult] = await db.query(`DELETE FROM stay_history WHERE booking_type = 'room'`);
      deletedCounts.roomBookings = (roomResult as any).affectedRows;
    }

    if (type === 'walkin' || type === 'all') {
      // Delete walk-in room bookings
      const [walkInResult] = await db.query(`DELETE FROM walk_in_bookings`);
      deletedCounts.walkInBookings = (walkInResult as any).affectedRows;
    }

    if (type === 'daypass' || type === 'all') {
      // Delete day pass bookings from stay_history
      const [dayPassStayResult] = await db.query(`DELETE FROM stay_history WHERE booking_type = 'day_pass'`);
      deletedCounts.dayPassBookings = (dayPassStayResult as any).affectedRows;

      // Delete day pass walk-ins
      const [dayPassWalkInResult] = await db.query(`DELETE FROM day_pass_walk_in`);
      deletedCounts.dayPassWalkIns = (dayPassWalkInResult as any).affectedRows;
    }

    if (type === 'all') {
      // Also delete amenity bookings
      const [amenityResult] = await db.query(`DELETE FROM stay_history WHERE booking_type = 'amenity'`);
      deletedCounts.amenityBookings = (amenityResult as any).affectedRows;
    }

    res.json({ 
      success: true, 
      message: `History cleared successfully (type: ${type})`,
      deletedCounts
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
