import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Fix check-in and check-out times in stay_history table
export const fixCheckInOutTimes: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
      return;
    }

    // Update check-in times to be around 1:00 PM (13:00)
    // Variations: 12:30, 12:45, 13:00, 13:15, 13:30
    await db.query(`
      UPDATE stay_history
      SET actual_check_in = CASE 
        WHEN MOD(id, 5) = 0 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '12:30:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 1 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '12:45:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 2 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '13:00:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 3 THEN DATE_ADD(DATE(actual_check_in), INTERVAL '13:15:00' HOUR_SECOND)
        ELSE DATE_ADD(DATE(actual_check_in), INTERVAL '13:30:00' HOUR_SECOND)
      END
      WHERE actual_check_in IS NOT NULL
    `);

    // Update check-out times to be around 11:00 AM
    // Variations: 10:45, 10:55, 11:00, 11:05, 11:10
    await db.query(`
      UPDATE stay_history
      SET actual_check_out = CASE 
        WHEN MOD(id, 5) = 0 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '10:45:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 1 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '10:55:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 2 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '11:00:00' HOUR_SECOND)
        WHEN MOD(id, 5) = 3 THEN DATE_ADD(DATE(actual_check_out), INTERVAL '11:05:00' HOUR_SECOND)
        ELSE DATE_ADD(DATE(actual_check_out), INTERVAL '11:10:00' HOUR_SECOND)
      END
      WHERE actual_check_out IS NOT NULL
    `);

    // Get sample of updated records
    const [sampleRecords] = await db.query(`
      SELECT 
        id,
        user_email,
        booking_type,
        DATE_FORMAT(actual_check_in, '%Y-%m-%d %h:%i %p') as check_in_time,
        DATE_FORMAT(actual_check_out, '%Y-%m-%d %h:%i %p') as check_out_time
      FROM stay_history
      WHERE booking_type = 'room'
      ORDER BY actual_check_in DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      message: 'Check-in and check-out times updated successfully',
      sampleRecords
    });
  } catch (error) {
    console.error('Fix check-in/out times error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fix check-in/out times',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
