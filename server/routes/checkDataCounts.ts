import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - Check data counts in all tables
export const checkDataCounts: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    // Get counts from all booking tables
    const [roomBookingsCount] = await db.query('SELECT COUNT(*) as count FROM room_bookings');
    const [amenityBookingsCount] = await db.query('SELECT COUNT(*) as count FROM amenity_bookings');
    const [dayPassBookingsCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_bookings');
    const [walkInBookingsCount] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings');
    const [dayPassWalkInCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const [stayHistoryCount] = await db.query('SELECT COUNT(*) as count FROM stay_history');

    // Get sample records from each table
    const [roomSample] = await db.query('SELECT id, user_email, status, created_at FROM room_bookings ORDER BY created_at DESC LIMIT 5');
    const [walkInSample] = await db.query('SELECT id, guest_name, total_amount, created_at FROM walk_in_bookings ORDER BY created_at DESC LIMIT 5');
    const [dayPassWalkInSample] = await db.query('SELECT id, representative_name, total_amount, created_at FROM day_pass_walk_in ORDER BY created_at DESC LIMIT 5');
    const [historySample] = await db.query('SELECT id, booking_type, total_spent, created_at FROM stay_history ORDER BY created_at DESC LIMIT 5');

    // Calculate total revenue from each source
    const [roomRevenue] = await db.query('SELECT SUM(CAST(total_amount AS DECIMAL(10,2))) as total FROM room_bookings WHERE status IN ("approved", "checked_out")');
    const [walkInRevenue] = await db.query('SELECT SUM(CAST(total_amount AS DECIMAL(10,2))) as total FROM walk_in_bookings');
    const [dayPassWalkInRevenue] = await db.query('SELECT SUM(CAST(total_amount AS DECIMAL(10,2))) as total FROM day_pass_walk_in');
    const [historyRevenue] = await db.query('SELECT SUM(CAST(total_spent AS DECIMAL(10,2))) as total FROM stay_history');

    res.json({ 
      success: true,
      counts: {
        roomBookings: (roomBookingsCount as any)[0].count,
        amenityBookings: (amenityBookingsCount as any)[0].count,
        dayPassBookings: (dayPassBookingsCount as any)[0].count,
        walkInBookings: (walkInBookingsCount as any)[0].count,
        dayPassWalkIn: (dayPassWalkInCount as any)[0].count,
        stayHistory: (stayHistoryCount as any)[0].count
      },
      revenue: {
        roomBookings: (roomRevenue as any)[0].total || 0,
        walkInBookings: (walkInRevenue as any)[0].total || 0,
        dayPassWalkIn: (dayPassWalkInRevenue as any)[0].total || 0,
        stayHistory: (historyRevenue as any)[0].total || 0
      },
      samples: {
        roomBookings: roomSample,
        walkInBookings: walkInSample,
        dayPassWalkIn: dayPassWalkInSample,
        stayHistory: historySample
      }
    });
  } catch (error) {
    console.error('Check data counts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check data counts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
