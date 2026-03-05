import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

// Generate booking report
export const generateBookingReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const connection = await db.getConnection();

    try {
      let query = '';
      let params: any[] = [];

      if (type === 'room' || !type) {
        query = `
          SELECT 
            'room' as booking_type,
            rb.id,
            rb.user_email,
            rb.room_name,
            rb.room_type,
            rb.check_in,
            rb.check_out,
            rb.guests,
            rb.total_amount,
            rb.status,
            rb.created_at,
            rb.actual_check_in,
            rb.actual_check_out
          FROM room_bookings rb
          WHERE 1=1
        `;
      } else if (type === 'amenity') {
        query = `
          SELECT 
            'amenity' as booking_type,
            ab.id,
            ab.user_email,
            ab.amenity_name,
            ab.booking_date,
            ab.booking_time,
            ab.number_of_pax,
            ab.total_amount,
            ab.status,
            ab.created_at
          FROM amenity_bookings ab
          WHERE 1=1
        `;
      } else if (type === 'daypass') {
        query = `
          SELECT 
            'daypass' as booking_type,
            dpb.id,
            dpb.user_email,
            dpb.booking_date,
            dpb.total_amount,
            dpb.status,
            dpb.created_at
          FROM day_pass_bookings dpb
          WHERE 1=1
        `;
      }

      if (startDate) {
        query += ` AND DATE(created_at) >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND DATE(created_at) <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY created_at DESC`;

      const [bookings] = await connection.query<RowDataPacket[]>(query, params);

      // Calculate summary statistics
      const totalBookings = bookings.length;
      const approvedBookings = bookings.filter((b: any) => b.status === 'approved').length;
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
      const rejectedBookings = bookings.filter((b: any) => b.status === 'rejected').length;

      const totalRevenue = bookings
        .filter((b: any) => b.status === 'approved')
        .reduce((sum: number, b: any) => {
          const amount = parseFloat(b.total_amount.replace(/[₱,]/g, '') || '0');
          return sum + amount;
        }, 0);

      connection.release();

      res.json({
        success: true,
        report: {
          period: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present'
          },
          summary: {
            totalBookings,
            approvedBookings,
            pendingBookings,
            rejectedBookings,
            totalRevenue: totalRevenue.toFixed(2)
          },
          bookings
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error generating booking report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate booking report' 
    });
  }
};

// Generate revenue report
export const generateRevenueReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const connection = await db.getConnection();

    try {
      let dateFormat = '%Y-%m-%d';
      let groupByClause = 'DATE(created_at)';

      if (groupBy === 'month') {
        dateFormat = '%Y-%m';
        groupByClause = 'DATE_FORMAT(created_at, "%Y-%m")';
      } else if (groupBy === 'week') {
        groupByClause = 'YEARWEEK(created_at)';
      }

      // Room bookings revenue
      const [roomRevenue] = await connection.query<RowDataPacket[]>(
        `SELECT 
          ${groupByClause} as period,
          COUNT(*) as bookings,
          SUM(CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))) as revenue
        FROM room_bookings
        WHERE status = 'approved'
        ${startDate ? `AND DATE(created_at) >= ?` : ''}
        ${endDate ? `AND DATE(created_at) <= ?` : ''}
        GROUP BY period
        ORDER BY period DESC`,
        [startDate, endDate].filter(Boolean)
      );

      // Amenity bookings revenue
      const [amenityRevenue] = await connection.query<RowDataPacket[]>(
        `SELECT 
          ${groupByClause} as period,
          COUNT(*) as bookings,
          SUM(CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))) as revenue
        FROM amenity_bookings
        WHERE status = 'approved'
        ${startDate ? `AND DATE(created_at) >= ?` : ''}
        ${endDate ? `AND DATE(created_at) <= ?` : ''}
        GROUP BY period
        ORDER BY period DESC`,
        [startDate, endDate].filter(Boolean)
      );

      // Day pass bookings revenue
      const [dayPassRevenue] = await connection.query<RowDataPacket[]>(
        `SELECT 
          ${groupByClause} as period,
          COUNT(*) as bookings,
          SUM(CAST(REPLACE(REPLACE(total_amount, '₱', ''), ',', '') AS DECIMAL(10,2))) as revenue
        FROM day_pass_bookings
        WHERE status = 'approved'
        ${startDate ? `AND DATE(created_at) >= ?` : ''}
        ${endDate ? `AND DATE(created_at) <= ?` : ''}
        GROUP BY period
        ORDER BY period DESC`,
        [startDate, endDate].filter(Boolean)
      );

      // Combine and calculate totals
      const allPeriods = new Set([
        ...roomRevenue.map((r: any) => r.period),
        ...amenityRevenue.map((r: any) => r.period),
        ...dayPassRevenue.map((r: any) => r.period)
      ]);

      const revenueByPeriod = Array.from(allPeriods).map(period => {
        const room = roomRevenue.find((r: any) => r.period === period);
        const amenity = amenityRevenue.find((r: any) => r.period === period);
        const dayPass = dayPassRevenue.find((r: any) => r.period === period);

        // Safely parse revenue values, handling NULL, undefined, and string values
        const roomRev = Number(room?.revenue) || 0;
        const amenityRev = Number(amenity?.revenue) || 0;
        const dayPassRev = Number(dayPass?.revenue) || 0;

        const totalRevenue = roomRev + amenityRev + dayPassRev;

        const totalBookings = 
          (room?.bookings || 0) +
          (amenity?.bookings || 0) +
          (dayPass?.bookings || 0);

        return {
          period,
          roomRevenue: roomRev,
          roomBookings: room?.bookings || 0,
          amenityRevenue: amenityRev,
          amenityBookings: amenity?.bookings || 0,
          dayPassRevenue: dayPassRev,
          dayPassBookings: dayPass?.bookings || 0,
          totalRevenue,
          totalBookings
        };
      }).sort((a, b) => b.period.localeCompare(a.period));

      const grandTotal = revenueByPeriod.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalBookingsCount = revenueByPeriod.reduce((sum, p) => sum + p.totalBookings, 0);

      connection.release();

      res.json({
        success: true,
        report: {
          period: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present',
            groupBy: groupBy || 'day'
          },
          summary: {
            grandTotal: grandTotal.toFixed(2),
            totalBookings: totalBookingsCount
          },
          data: revenueByPeriod
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error generating revenue report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate revenue report' 
    });
  }
};

// Generate occupancy report
export const generateOccupancyReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const connection = await db.getConnection();

    try {
      // Daily occupancy data
      const [occupancyData] = await connection.query<RowDataPacket[]>(
        `SELECT 
          DATE(actual_check_in) as date,
          COUNT(DISTINCT room_name) as occupied_rooms,
          (SELECT COUNT(DISTINCT room_name) FROM room_bookings) as total_rooms
        FROM room_bookings
        WHERE actual_check_in IS NOT NULL
        ${startDate ? `AND DATE(actual_check_in) >= ?` : ''}
        ${endDate ? `AND DATE(actual_check_in) <= ?` : ''}
        GROUP BY DATE(actual_check_in)
        ORDER BY date DESC`,
        [startDate, endDate].filter(Boolean)
      );

      const occupancyWithRate = occupancyData.map((d: any) => ({
        ...d,
        occupancyRate: d.total_rooms > 0 
          ? ((d.occupied_rooms / d.total_rooms) * 100).toFixed(1)
          : '0.0'
      }));

      // Average occupancy rate
      const avgOccupancy = occupancyWithRate.length > 0
        ? (occupancyWithRate.reduce((sum: number, d: any) => sum + parseFloat(d.occupancyRate), 0) / occupancyWithRate.length).toFixed(1)
        : '0.0';

      // Room type breakdown
      const [roomTypeBreakdown] = await connection.query<RowDataPacket[]>(
        `SELECT 
          room_type,
          COUNT(*) as total_bookings,
          SUM(CASE WHEN actual_check_in IS NOT NULL THEN 1 ELSE 0 END) as check_ins
        FROM room_bookings
        WHERE status = 'approved'
        ${startDate ? `AND DATE(created_at) >= ?` : ''}
        ${endDate ? `AND DATE(created_at) <= ?` : ''}
        GROUP BY room_type`,
        [startDate, endDate].filter(Boolean)
      );

      connection.release();

      res.json({
        success: true,
        report: {
          period: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present'
          },
          summary: {
            averageOccupancy: avgOccupancy
          },
          dailyOccupancy: occupancyWithRate,
          roomTypeBreakdown
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error generating occupancy report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate occupancy report' 
    });
  }
};

// Generate guest activity report
export const generateGuestReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const connection = await db.getConnection();

    try {
      const [guestData] = await connection.query<RowDataPacket[]>(
        `SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          COUNT(DISTINCT rb.id) as total_bookings,
          SUM(CASE WHEN rb.status = 'approved' THEN CAST(REPLACE(REPLACE(rb.total_amount, '₱', ''), ',', '') AS DECIMAL(10,2)) ELSE 0 END) as total_spent,
          MAX(rb.created_at) as last_booking_date,
          MIN(rb.created_at) as first_booking_date
        FROM users u
        LEFT JOIN room_bookings rb ON u.id = rb.user_id
        WHERE u.role = 'client'
        ${startDate ? `AND DATE(rb.created_at) >= ?` : ''}
        ${endDate ? `AND DATE(rb.created_at) <= ?` : ''}
        GROUP BY u.id
        HAVING total_bookings > 0
        ORDER BY total_spent DESC`,
        [startDate, endDate].filter(Boolean)
      );

      // Calculate summary
      const totalGuests = guestData.length;
      const totalSpent = guestData.reduce((sum: number, g: any) => sum + (Number(g.total_spent) || 0), 0);
      const avgSpentPerGuest = totalGuests > 0 ? (totalSpent / totalGuests).toFixed(2) : '0.00';

      connection.release();

      res.json({
        success: true,
        report: {
          period: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present'
          },
          summary: {
            totalGuests,
            totalSpent: totalSpent.toFixed(2),
            avgSpentPerGuest
          },
          guests: guestData
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error generating guest report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate guest report' 
    });
  }
};
