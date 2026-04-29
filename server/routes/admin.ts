import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";
import { insertAuditLog } from "./auditLog";

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
          status,
          created_at,
          (SELECT COUNT(*) FROM room_bookings WHERE user_id = users.id) as total_bookings
        FROM users
        WHERE role IN ('admin', 'receptionist') AND status != 'deleted'
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

// Get tracked user activity analytics for admin dashboard
export const getUserActivityAnalytics: RequestHandler = async (req, res) => {
  try {
    const rawRange = req.query.range as string;
    const range: 'week' | 'month' | 'year' = ['week', 'month', 'year'].includes(rawRange)
      ? (rawRange as 'week' | 'month' | 'year')
      : 'week';
    const intervalSql = range === 'week' ? '7 DAY' : range === 'month' ? '30 DAY' : '365 DAY';
    const useMonthGroup = range === 'year';
    const trendDays = range === 'week' ? 7 : 30;

    const connection = await db.getConnection();

    try {
      const [totalActivitiesResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM user_activity_tracking'
      );

      const [activitiesInRangeResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count
         FROM user_activity_tracking
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})`
      );

      const [uniqueUsersResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM user_activity_tracking
         WHERE user_id IS NOT NULL`
      );

      const [uniqueSessionsResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(DISTINCT session_id) as count FROM user_activity_tracking'
      );

      const [topActivityTypes] = await connection.query<RowDataPacket[]>(
        `SELECT activity_type, COUNT(*) as count
         FROM user_activity_tracking
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})
         GROUP BY activity_type
         ORDER BY count DESC`
      );

      const [activityByDay] = await connection.query<RowDataPacket[]>(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM user_activity_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})
        GROUP BY DATE(created_at)
        ORDER BY date ASC`
      );

      const [activityTypesTrend] = await connection.query<RowDataPacket[]>(
        `SELECT 
          activity_type,
          COUNT(*) as count
        FROM user_activity_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})
        GROUP BY activity_type
        ORDER BY count DESC`
      );

      const [bookingViewFrequencyResult] = await connection.query<RowDataPacket[]>(
        `SELECT
          SUM(CASE WHEN activity_type = 'view_room' THEN 1 ELSE 0 END) as room_views,
          SUM(CASE WHEN activity_type = 'view_amenity' THEN 1 ELSE 0 END) as amenity_views,
          SUM(CASE WHEN activity_type = 'view_daypass' THEN 1 ELSE 0 END) as daypass_views,
          SUM(CASE WHEN activity_type IN ('view_room', 'view_amenity', 'view_daypass') THEN time_spent ELSE 0 END) as total_booking_view_time
        FROM user_activity_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})`
      );

      let bookingViewsByDay: Array<{
        date: string;
        roomViews: number;
        amenityViews: number;
        dayPassViews: number;
        total: number;
      }>;

      if (useMonthGroup) {
        const [bookingViewsByMonthRaw] = await connection.query<RowDataPacket[]>(
          `SELECT
            DATE_FORMAT(created_at, '%Y-%m') as period,
            SUM(CASE WHEN activity_type = 'view_room' THEN 1 ELSE 0 END) as roomViews,
            SUM(CASE WHEN activity_type = 'view_amenity' THEN 1 ELSE 0 END) as amenityViews,
            SUM(CASE WHEN activity_type = 'view_daypass' THEN 1 ELSE 0 END) as dayPassViews
          FROM user_activity_tracking
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
            AND activity_type IN ('view_room', 'view_amenity', 'view_daypass')
          GROUP BY period
          ORDER BY period ASC`
        );
        const monthMap = new Map<string, RowDataPacket>();
        bookingViewsByMonthRaw.forEach((row) => { monthMap.set(String(row.period), row); });
        bookingViewsByDay = Array.from({ length: 12 }, (_, index) => {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - (11 - index));
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const row = monthMap.get(key);
          const roomViews = Number(row?.roomViews || 0);
          const amenityViews = Number(row?.amenityViews || 0);
          const dayPassViews = Number(row?.dayPassViews || 0);
          return { date: key, roomViews, amenityViews, dayPassViews, total: roomViews + amenityViews + dayPassViews };
        });
      } else {
        const [bookingViewsByDayRaw] = await connection.query<RowDataPacket[]>(
          `SELECT
            DATE(created_at) as date,
            SUM(CASE WHEN activity_type = 'view_room' THEN 1 ELSE 0 END) as roomViews,
            SUM(CASE WHEN activity_type = 'view_amenity' THEN 1 ELSE 0 END) as amenityViews,
            SUM(CASE WHEN activity_type = 'view_daypass' THEN 1 ELSE 0 END) as dayPassViews
          FROM user_activity_tracking
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${trendDays - 1} DAY)
            AND activity_type IN ('view_room', 'view_amenity', 'view_daypass')
          GROUP BY DATE(created_at)
          ORDER BY date ASC`
        );
        const bookingViewsByDateMap = new Map<string, RowDataPacket>();
        bookingViewsByDayRaw.forEach((row) => {
          const date = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
          bookingViewsByDateMap.set(date, row);
        });
        bookingViewsByDay = Array.from({ length: trendDays }, (_, index) => {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          currentDate.setDate(currentDate.getDate() - (trendDays - 1 - index));
          const key = currentDate.toISOString().split('T')[0];
          const row = bookingViewsByDateMap.get(key);
          const roomViews = Number(row?.roomViews || 0);
          const amenityViews = Number(row?.amenityViews || 0);
          const dayPassViews = Number(row?.dayPassViews || 0);
          return { date: key, roomViews, amenityViews, dayPassViews, total: roomViews + amenityViews + dayPassViews };
        });
      }

      const [topViewedItems] = await connection.query<RowDataPacket[]>(
        `SELECT
          activity_type,
          COALESCE(NULLIF(item_name, ''), NULLIF(item_type, ''), 'Unspecified') as label,
          COUNT(*) as count,
          SUM(time_spent) as total_time
        FROM user_activity_tracking
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})
          AND activity_type IN ('view_room', 'view_amenity', 'view_daypass')
        GROUP BY activity_type, label
        ORDER BY count DESC, total_time DESC
        LIMIT 8`
      );

      const [mostEngagedUsers] = await connection.query<RowDataPacket[]>(
        `SELECT
          u.id as user_id,
          u.name,
          u.email,
          COUNT(*) as total_views,
          SUM(uat.time_spent) as total_time
        FROM user_activity_tracking uat
        INNER JOIN users u ON u.id = uat.user_id
        WHERE uat.created_at >= DATE_SUB(NOW(), INTERVAL ${intervalSql})
          AND uat.activity_type IN ('view_room', 'view_amenity', 'view_daypass')
        GROUP BY u.id, u.name, u.email
        ORDER BY total_views DESC, total_time DESC
        LIMIT 6`
      );

      const bookingViewFrequency = {
        roomViews: Number(bookingViewFrequencyResult[0]?.room_views || 0),
        amenityViews: Number(bookingViewFrequencyResult[0]?.amenity_views || 0),
        dayPassViews: Number(bookingViewFrequencyResult[0]?.daypass_views || 0),
        totalBookingViewTime: Number(bookingViewFrequencyResult[0]?.total_booking_view_time || 0)
      };

      const totalBookingViews = bookingViewFrequency.roomViews + bookingViewFrequency.amenityViews + bookingViewFrequency.dayPassViews;

      connection.release();

      res.json({
        success: true,
        analytics: {
          totalActivities: totalActivitiesResult[0]?.count || 0,
          activitiesLast7Days: activitiesInRangeResult[0]?.count || 0,
          uniqueTrackedUsers: uniqueUsersResult[0]?.count || 0,
          uniqueSessions: uniqueSessionsResult[0]?.count || 0,
          topActivityTypes,
          activityByDay,
          activityTypesTrend,
          bookingViewFrequency: {
            ...bookingViewFrequency,
            totalBookingViews
          },
          bookingViewsByDay,
          topViewedItems,
          mostEngagedUsers
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching user activity analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity analytics'
    });
  }
};

// Lock a user account
export const lockUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const connection = await db.getConnection();

    try {
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['locked', userId]
      );

      connection.release();

      await insertAuditLog(
        req.session.userId!,
        req.session.userName || 'Admin',
        'LOCK_USER',
        'user',
        userId as string,
        `Locked user account #${userId}`,
        req.ip || ''
      );

      res.json({
        success: true,
        message: 'User account locked successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error locking user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to lock user account' 
    });
  }
};

// Unlock a user account (make active)
export const unlockUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const connection = await db.getConnection();

    try {
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['active', userId]
      );

      connection.release();

      await insertAuditLog(
        req.session.userId!,
        req.session.userName || 'Admin',
        'UNLOCK_USER',
        'user',
        userId as string,
        `Unlocked user account #${userId}`,
        req.ip || ''
      );

      res.json({
        success: true,
        message: 'User account activated successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error unlocking user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to activate user account' 
    });
  }
};

// Delete a user account
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const connection = await db.getConnection();

    try {
      // Check if user exists and is not admin
      const [userCheck] = await connection.query<RowDataPacket[]>(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );

      if (userCheck.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (userCheck[0].role === 'admin') {
        connection.release();
        return res.status(403).json({
          success: false,
          message: 'Cannot delete admin accounts'
        });
      }

      // Soft delete - mark status as deleted
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['deleted', userId]
      );

      connection.release();

      await insertAuditLog(
        req.session.userId!,
        req.session.userName || 'Admin',
        'DELETE_USER',
        'user',
        userId as string,
        `Deleted user account #${userId}`,
        req.ip || ''
      );

      res.json({
        success: true,
        message: 'User account deleted successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user account' 
    });
  }
};

// Upload GCash QR Code
export const uploadGcashQr: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Define the target path for the GCash QR code
    const publicDir = path.join(process.cwd(), 'public');
    const targetPath = path.join(publicDir, 'gcash-qr.jpg');
    
    // Move the uploaded file to the public directory
    await fs.rename(req.file.path, targetPath);
    
    // Log the action
    if (req.user) {
      await insertAuditLog(
        req.user.id,
        'update',
        'gcash_qr',
        null,
        'Updated GCash QR code image'
      );
    }

    res.json({
      success: true,
      message: 'GCash QR code updated successfully',
      filename: 'gcash-qr.jpg'
    });

  } catch (error) {
    console.error('❌ Error uploading GCash QR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload GCash QR code'
    });
  }
};
