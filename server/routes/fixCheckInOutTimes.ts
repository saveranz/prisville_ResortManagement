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

    // Get all records that need updating
    const [records] = await db.query(`
      SELECT id, actual_check_in, actual_check_out
      FROM stay_history
      WHERE actual_check_in IS NOT NULL
    `);

    console.log(`Found ${(records as any[]).length} records to update`);

    // Update each record individually with proper time calculation
    for (const record of records as any[]) {
      const checkInDate = new Date(record.actual_check_in);
      const checkOutDate = record.actual_check_out ? new Date(record.actual_check_out) : null;
      
      // Set check-in time based on ID (around 1:00 PM Philippine time = 05:00 UTC)
      const checkInHour = [4, 4, 5, 5, 5][record.id % 5]; // 12:30, 12:45, 1:00, 1:05, 1:25 PH = 04:30, 04:45, 05:00, 05:05, 05:25 UTC
      const checkInMinute = [30, 45, 0, 5, 25][record.id % 5];
      checkInDate.setUTCHours(checkInHour, checkInMinute, 0, 0);
      
      // Set check-out time based on ID (around 11:00 AM Philippine time = 03:00 UTC)
      let checkOutDateStr = null;
      if (checkOutDate) {
        const checkOutHour = [2, 2, 3, 3, 3][record.id % 5]; // 10:45, 10:55, 11:00, 11:05, 11:10 PH = 02:45, 02:55, 03:00, 03:05, 03:10 UTC
        const checkOutMinute = [45, 55, 0, 5, 10][record.id % 5];
        checkOutDate.setUTCHours(checkOutHour, checkOutMinute, 0, 0);
        checkOutDateStr = checkOutDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      const checkInDateStr = checkInDate.toISOString().slice(0, 19).replace('T', ' ');
      
      // Update the record
      if (checkOutDateStr) {
        await db.query(
          `UPDATE stay_history SET actual_check_in = ?, actual_check_out = ? WHERE id = ?`,
          [checkInDateStr, checkOutDateStr, record.id]
        );
      } else {
        await db.query(
          `UPDATE stay_history SET actual_check_in = ? WHERE id = ?`,
          [checkInDateStr, record.id]
        );
      }
    }

    // Get sample of updated records
    const [afterUpdate] = await db.query(`
      SELECT 
        id,
        booking_type,
        actual_check_in,
        actual_check_out
      FROM stay_history
      WHERE actual_check_in IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      message: `Updated ${(records as any[]).length} records. Times are stored in UTC, will display as Philippine time in frontend.`,
      updatedCount: (records as any[]).length,
      sampleRecords: afterUpdate
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
