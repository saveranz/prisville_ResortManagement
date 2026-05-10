import { RequestHandler } from "express";
import db from "../db";

// Get booking analytics based on actual booking data (not activity tracking)
export const getBookingAnalytics: RequestHandler = async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get total bookings count (all time)
    const [totalRoomBookings] = await db.query('SELECT COUNT(*) as count FROM room_bookings');
    const [totalAmenityBookings] = await db.query('SELECT COUNT(*) as count FROM amenity_bookings');
    const [totalDayPassBookings] = await db.query('SELECT COUNT(*) as count FROM day_pass_bookings');
    const [totalWalkIns] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings');
    const [totalDayPassWalkIns] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    
    const totalBookings = 
      (totalRoomBookings as any)[0].count +
      (totalAmenityBookings as any)[0].count +
      (totalDayPassBookings as any)[0].count +
      (totalWalkIns as any)[0].count +
      (totalDayPassWalkIns as any)[0].count;
    
    // Get bookings in selected range
    const [roomBookingsInRange] = await db.query(
      'SELECT COUNT(*) as count FROM room_bookings WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    const [amenityBookingsInRange] = await db.query(
      'SELECT COUNT(*) as count FROM amenity_bookings WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    const [dayPassBookingsInRange] = await db.query(
      'SELECT COUNT(*) as count FROM day_pass_bookings WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    const [walkInsInRange] = await db.query(
      'SELECT COUNT(*) as count FROM walk_in_bookings WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    const [dayPassWalkInsInRange] = await db.query(
      'SELECT COUNT(*) as count FROM day_pass_walk_in WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    
    const bookingsInRange = 
      (roomBookingsInRange as any)[0].count +
      (amenityBookingsInRange as any)[0].count +
      (dayPassBookingsInRange as any)[0].count +
      (walkInsInRange as any)[0].count +
      (dayPassWalkInsInRange as any)[0].count;
    
    // Get bookings by type in range
    const roomBookingsCount = (roomBookingsInRange as any)[0].count + (walkInsInRange as any)[0].count;
    const amenityBookingsCount = (amenityBookingsInRange as any)[0].count;
    const dayPassBookingsCount = (dayPassBookingsInRange as any)[0].count + (dayPassWalkInsInRange as any)[0].count;
    
    // Get bookings by day for chart
    const [bookingsByDay] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'room' as type
      FROM room_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'room' as type
      FROM walk_in_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'amenity' as type
      FROM amenity_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'daypass' as type
      FROM day_pass_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'daypass' as type
      FROM day_pass_walk_in
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      
      ORDER BY date ASC
    `, [startDateStr, startDateStr, startDateStr, startDateStr, startDateStr]);
    
    // Aggregate by date and type
    const bookingsByDayMap = new Map();
    (bookingsByDay as any[]).forEach(row => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (!bookingsByDayMap.has(dateStr)) {
        bookingsByDayMap.set(dateStr, { date: dateStr, Room: 0, Amenity: 0, 'Day Pass': 0 });
      }
      const entry = bookingsByDayMap.get(dateStr);
      if (row.type === 'room') entry.Room += row.count;
      else if (row.type === 'amenity') entry.Amenity += row.count;
      else if (row.type === 'daypass') entry['Day Pass'] += row.count;
    });
    
    const bookingViewsByDay = Array.from(bookingsByDayMap.values());
    
    // Get top rooms (most booked)
    const [topRooms] = await db.query(`
      SELECT 
        room_numbers as name,
        COUNT(*) as value
      FROM (
        SELECT room_numbers FROM room_bookings WHERE DATE(created_at) >= ? AND room_numbers IS NOT NULL
        UNION ALL
        SELECT room_number as room_numbers FROM walk_in_bookings WHERE DATE(created_at) >= ? AND room_number IS NOT NULL
      ) as all_rooms
      GROUP BY room_numbers
      ORDER BY value DESC
      LIMIT 6
    `, [startDateStr, startDateStr]);
    
    res.json({
      success: true,
      analytics: {
        totalActivities: totalBookings,
        activitiesLast7Days: bookingsInRange,
        bookingViewFrequency: {
          roomViews: roomBookingsCount,
          amenityViews: amenityBookingsCount,
          dayPassViews: dayPassBookingsCount,
          totalBookingViewTime: 0 // Not tracking time, just bookings
        },
        bookingViewsByDay,
        topBookingInterests: topRooms
      }
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
