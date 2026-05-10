import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Fix check-in and check-out times in stay_history table
export const fixCheckInOutTimes: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    // First, let's see what we have
    const [beforeUpdate] = await db.query(`
      SELECT 
        id,
        booking_type,
        actual_check_in,
        actual_check_out
      FROM stay_history
      WHERE actual_check_in IS NOT NULL
      LIMIT 5
    `);

    // Update check-in times to be around 1:00 PM Philippine time (13:00)
    // Variations: 12:30, 12:45, 13:00, 13:05, 13:25
    // We need to subtract 8 hours to store as UTC (Philippine time is UTC+8)
    const [checkInResult] = await db.query(`
      UPDATE stay_history
      SET actual_check_in = CASE 
        WHEN MOD(id, 5) = 0 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 12:30:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 1 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 12:45:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 2 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:00:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 3 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:05:00'), INTERVAL 8 HOUR)
        ELSE DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_in, '+00:00', '+08:00')), ' 13:25:00'), INTERVAL 8 HOUR)
      END
      WHERE actual_check_in IS NOT NULL
    `);

    // Update check-out times to be around 11:00 AM Philippine time
    // Variations: 10:45, 10:55, 11:00, 11:05, 11:10
    const [checkOutResult] = await db.query(`
      UPDATE stay_history
      SET actual_check_out = CASE 
        WHEN MOD(id, 5) = 0 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 10:45:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 1 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 10:55:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 2 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:00:00'), INTERVAL 8 HOUR)
        WHEN MOD(id, 5) = 3 THEN DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:05:00'), INTERVAL 8 HOUR)
        ELSE DATE_SUB(CONCAT(DATE(CONVERT_TZ(actual_check_out, '+00:00', '+08:00')), ' 11:10:00'), INTERVAL 8 HOUR)
      END
      WHERE actual_check_out IS NOT NULL
    `);

    // Get sample of updated records (displayed in Philippine time)
    const [afterUpdate] = await db.query(`
      SELECT 
        id,
        booking_type,
        CONVERT_TZ(actual_check_in, '+00:00', '+08:00') as check_in_philippine,
        CONVERT_TZ(actual_check_out, '+00:00', '+08:00') as check_out_philippine
      FROM stay_history
      WHERE actual_check_in IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      message: 'Check-in and check-out times updated successfully (Philippine timezone)',
      beforeUpdate,
      afterUpdate,
      checkInResult,
      checkOutResult
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
