import { RequestHandler } from "express";
import db from "../db";

// Get booking analytics based on actual booking data (not activity tracking)
export const getBookingAnalytics: RequestHandler = async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;
    
    if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupByFormat = '%Y-%m-%d'; // Group by day
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupByFormat = '%Y-%m-%d'; // Group by day
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      groupByFormat = '%Y-%m'; // Group by month
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
    
    // Get completed stays count
    const [completedStays] = await db.query(
      'SELECT COUNT(*) as count FROM stay_history WHERE DATE(created_at) >= ?',
      [startDateStr]
    );
    
    // Get bookings by day/month for chart
    const [bookingsByPeriod] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        'Room' as type,
        COUNT(*) as count
      FROM room_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE_FORMAT(created_at, ?)
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        'Room' as type,
        COUNT(*) as count
      FROM walk_in_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE_FORMAT(created_at, ?)
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        'Amenity' as type,
        COUNT(*) as count
      FROM amenity_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE_FORMAT(created_at, ?)
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        'Day Pass' as type,
        COUNT(*) as count
      FROM day_pass_bookings
      WHERE DATE(created_at) >= ?
      GROUP BY DATE_FORMAT(created_at, ?)
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        'Day Pass' as type,
        COUNT(*) as count
      FROM day_pass_walk_in
      WHERE DATE(created_at) >= ?
      GROUP BY DATE_FORMAT(created_at, ?)
      
      ORDER BY period ASC
    `, [
      groupByFormat, startDateStr, groupByFormat,
      groupByFormat, startDateStr, groupByFormat,
      groupByFormat, startDateStr, groupByFormat,
      groupByFormat, startDateStr, groupByFormat,
      groupByFormat, startDateStr, groupByFormat
    ]);
    
    // Aggregate by period and type
    const bookingsByPeriodMap = new Map();
    (bookingsByPeriod as any[]).forEach(row => {
      const period = row.period;
      if (!bookingsByPeriodMap.has(period)) {
        bookingsByPeriodMap.set(period, { date: period, Room: 0, Amenity: 0, 'Day Pass': 0 });
      }
      const entry = bookingsByPeriodMap.get(period);
      entry[row.type] += row.count;
    });
    
    const bookingViewsByDay = Array.from(bookingsByPeriodMap.values());
    
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
          totalBookingViewTime: (completedStays as any)[0].count
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
