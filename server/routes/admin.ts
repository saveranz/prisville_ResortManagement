import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

// Get comprehensive dashboard statistics
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      // Total bookings by type
      const [roomBookingsCount] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM room_bookings'
      );
      const [amenityBookingsCount] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM amenity_bookings'
      );
      const [dayPassBookingsCount] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM day_pass_bookings'
      );

      // Pending approvals
      const [pendingRooms] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM room_bookings WHERE status = "pending"'
      );
      const [pendingAmenities] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM amenity_bookings WHERE status = "pending"'
      );
      const [pendingDayPasses] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM day_pass_bookings WHERE status = "pending"'
      );

      // Currently checked in guests
      const [checkedInGuests] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM room_bookings WHERE actual_check_in IS NOT NULL AND actual_check_out IS NULL'
      );

      // Total revenue (approved bookings only)
      const [roomRevenue] = await connection.query<RowDataPacket[]>(
        'SELECT SUM(CAST(REPLACE(REPLACE(total_amount, "₱", ""), ",", "") AS DECIMAL(10,2))) as revenue FROM room_bookings WHERE status = "approved"'
      );
      const [amenityRevenue] = await connection.query<RowDataPacket[]>(
        'SELECT SUM(CAST(REPLACE(REPLACE(total_amount, "₱", ""), ",", "") AS DECIMAL(10,2))) as revenue FROM amenity_bookings WHERE status = "approved"'
      );
      const [dayPassRevenue] = await connection.query<RowDataPacket[]>(
        'SELECT SUM(CAST(REPLACE(REPLACE(total_amount, "₱", ""), ",", "") AS DECIMAL(10,2))) as revenue FROM day_pass_bookings WHERE status = "approved"'
      );

      // Total users
      const [totalUsers] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM users'
      );

      // Active users (with bookings)
      const [activeUsers] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(DISTINCT user_id) as count FROM room_bookings'
      );

      // Room occupancy rate (currently occupied / total rooms)
      const [totalRooms] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(DISTINCT room_name) as count FROM room_bookings'
      );
      const [occupiedRooms] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(DISTINCT room_name) as count FROM room_bookings WHERE actual_check_in IS NOT NULL AND actual_check_out IS NULL'
      );

      // Recent bookings (last 7 days)
      const [recentBookings] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM room_bookings WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
      );

      // Booking trends (last 30 days grouped by day)
      const [bookingTrends] = await connection.query<RowDataPacket[]>(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM room_bookings 
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`
      );

      // Status breakdown
      const [statusBreakdown] = await connection.query<RowDataPacket[]>(
        `SELECT 
          status,
          COUNT(*) as count
        FROM room_bookings
        GROUP BY status`
      );

      // Calculate totals
      const totalBookings = 
        (roomBookingsCount[0]?.count || 0) + 
        (amenityBookingsCount[0]?.count || 0) + 
        (dayPassBookingsCount[0]?.count || 0);

      const totalPending = 
        (pendingRooms[0]?.count || 0) + 
        (pendingAmenities[0]?.count || 0) + 
        (pendingDayPasses[0]?.count || 0);

      const totalRevenue = 
        (parseFloat(roomRevenue[0]?.revenue || '0')) + 
        (parseFloat(amenityRevenue[0]?.revenue || '0')) + 
        (parseFloat(dayPassRevenue[0]?.revenue || '0'));

      const occupancyRate = totalRooms[0]?.count > 0 
        ? ((occupiedRooms[0]?.count || 0) / totalRooms[0].count * 100).toFixed(1)
        : '0.0';

      connection.release();

      res.json({
        success: true,
        stats: {
          totalBookings,
          roomBookings: roomBookingsCount[0]?.count || 0,
          amenityBookings: amenityBookingsCount[0]?.count || 0,
          dayPassBookings: dayPassBookingsCount[0]?.count || 0,
          pendingApprovals: totalPending,
          checkedInGuests: checkedInGuests[0]?.count || 0,
          totalRevenue: totalRevenue.toFixed(2),
          totalUsers: totalUsers[0]?.count || 0,
          activeUsers: activeUsers[0]?.count || 0,
          occupancyRate: occupancyRate,
          recentBookings: recentBookings[0]?.count || 0,
          bookingTrends,
          statusBreakdown
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard statistics' 
    });
  }
};

// Get all users for management
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [users] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id, 
          email, 
          name, 
          phone, 
          role, 
          created_at,
          (SELECT COUNT(*) FROM room_bookings WHERE user_id = users.id) as total_bookings
        FROM users
        WHERE role IN ('admin', 'receptionist')
        ORDER BY created_at DESC`
      );

      connection.release();

      res.json({
        success: true,
        users
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
};

// Update user role
export const updateUserRole: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['client', 'receptionist', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be client, receptionist, or admin.'
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );

      connection.release();

      res.json({
        success: true,
        message: 'User role updated successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role' 
    });
  }
};

// Get guest activity summary
export const getGuestActivity: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      // Get all guests with their booking and activity info
      const [guests] = await connection.query<RowDataPacket[]>(
        `SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          COUNT(DISTINCT rb.id) as total_room_bookings,
          COUNT(DISTINCT ab.id) as total_amenity_bookings,
          COUNT(DISTINCT dpb.id) as total_daypass_bookings,
          MAX(rb.created_at) as last_booking_date,
          SUM(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN 1 ELSE 0 END) as currently_checked_in
        FROM users u
        LEFT JOIN room_bookings rb ON u.id = rb.user_id
        LEFT JOIN amenity_bookings ab ON u.id = ab.user_id
        LEFT JOIN day_pass_bookings dpb ON u.id = dpb.user_id
        WHERE u.role = 'client'
        GROUP BY u.id
        ORDER BY last_booking_date DESC`
      );

      connection.release();

      res.json({
        success: true,
        guests
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching guest activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch guest activity' 
    });
  }
};

// Get room occupancy details
export const getRoomOccupancy: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      // Get all rooms with their current status
      const [rooms] = await connection.query<RowDataPacket[]>(
        `SELECT 
          rb.room_name,
          rb.room_type,
          MAX(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN 1 ELSE 0 END) as is_occupied,
          MAX(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN rb.user_email END) as current_guest,
          MAX(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN rb.actual_check_in END) as check_in_date,
          MAX(CASE WHEN rb.actual_check_in IS NOT NULL AND rb.actual_check_out IS NULL THEN rb.check_out END) as expected_checkout,
          COUNT(DISTINCT CASE WHEN rb.status = 'approved' AND rb.check_in >= CURDATE() THEN rb.id END) as upcoming_bookings
        FROM room_bookings rb
        GROUP BY rb.room_name, rb.room_type
        ORDER BY rb.room_name`
      );

      // Get summary stats
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((r: any) => r.is_occupied === 1).length;
      const availableRooms = totalRooms - occupiedRooms;
      const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';

      connection.release();

      res.json({
        success: true,
        summary: {
          totalRooms,
          occupiedRooms,
          availableRooms,
          occupancyRate
        },
        rooms
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching room occupancy:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch room occupancy' 
    });
  }
};

// Get booking issues/inquiries
export const getBookingIssues: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [issues] = await connection.query<RowDataPacket[]>(
        `SELECT 
          bi.*,
          u.email as user_email,
          u.first_name,
          u.last_name
        FROM booking_issues bi
        LEFT JOIN users u ON bi.user_id = u.id
        ORDER BY bi.created_at DESC`
      );

      connection.release();

      res.json({
        success: true,
        issues
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching booking issues:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking issues' 
    });
  }
};
