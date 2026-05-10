import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

// Generate stay history report
export const generateStayHistoryReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const connection = await db.getConnection();

    try {
      let query = `
        SELECT 
          sh.id,
          sh.user_email,
          sh.booking_id,
          sh.booking_type,
          sh.room_name,
          sh.amenity_name,
          sh.check_in_date,
          sh.check_out_date,
          sh.actual_check_in,
          sh.actual_check_out,
          sh.nights_stayed,
          sh.guests,
          sh.total_spent,
          sh.payment_status,
          sh.guest_notes,
          sh.staff_notes,
          sh.rating,
          sh.created_at,
          u.name as guest_name,
          u.phone as guest_phone
        FROM stay_history sh
        LEFT JOIN users u ON sh.user_id = u.id
        WHERE 1=1
      `;

      const params: any[] = [];

      // Filter by check-in date range
      if (startDate) {
        query += ' AND DATE(sh.actual_check_in) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND DATE(sh.actual_check_in) <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY sh.actual_check_in DESC';

      const [records] = await connection.query<RowDataPacket[]>(query, params);

      // Calculate summary statistics
      const totalRecords = records.length;
      const totalRevenue = records.reduce((sum, record) => sum + parseFloat(record.total_spent || '0'), 0);
      const totalNights = records.reduce((sum, record) => sum + (record.nights_stayed || 0), 0);
      const totalGuests = records.reduce((sum, record) => sum + (record.guests || 0), 0);

      // Breakdown by booking type
      const roomStays = records.filter(r => r.booking_type === 'room').length;
      const amenityStays = records.filter(r => r.booking_type === 'amenity').length;
      const dayPassStays = records.filter(r => r.booking_type === 'daypass').length;

      connection.release();

      res.json({
        success: true,
        report: {
          records,
          summary: {
            totalRecords,
            totalRevenue: totalRevenue.toFixed(2),
            totalNights,
            totalGuests,
            averageStayLength: totalRecords > 0 ? (totalNights / totalRecords).toFixed(1) : '0',
            roomStays,
            amenityStays,
            dayPassStays
          }
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error generating stay history report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate stay history report'
    });
  }
};
