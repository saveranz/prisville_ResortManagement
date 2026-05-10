import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Fix created_at times in walk_in_bookings and day_pass_walk_in tables
export const fixWalkInTimes: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    // Get all walk-in room bookings
    const [walkInRecords] = await db.query(`
      SELECT id, created_at
      FROM walk_in_bookings
    `);

    console.log(`Found ${(walkInRecords as any[]).length} walk-in room bookings to update`);

    // Update each walk-in record with check-in time around 1:00 PM Philippine time
    for (const record of walkInRecords as any[]) {
      const date = new Date(record.created_at);
      
      // Set time based on ID (around 1:00 PM Philippine time = 05:00 UTC)
      const hour = [4, 4, 5, 5, 5][record.id % 5]; // 12:30, 12:45, 1:00, 1:05, 1:25 PH = 04:30, 04:45, 05:00, 05:05, 05:25 UTC
      const minute = [30, 45, 0, 5, 25][record.id % 5];
      date.setUTCHours(hour, minute, 0, 0);
      
      const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');
      
      await db.query(
        `UPDATE walk_in_bookings SET created_at = ? WHERE id = ?`,
        [dateStr, record.id]
      );
    }

    // Get all day pass walk-in bookings
    const [dayPassRecords] = await db.query(`
      SELECT id, created_at
      FROM day_pass_walk_in
    `);

    console.log(`Found ${(dayPassRecords as any[]).length} day pass walk-in bookings to update`);

    // Update each day pass walk-in record
    for (const record of dayPassRecords as any[]) {
      const date = new Date(record.created_at);
      
      // Set time based on ID (around 1:00 PM Philippine time = 05:00 UTC)
      const hour = [4, 4, 5, 5, 5][record.id % 5];
      const minute = [30, 45, 0, 5, 25][record.id % 5];
      date.setUTCHours(hour, minute, 0, 0);
      
      const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');
      
      await db.query(
        `UPDATE day_pass_walk_in SET created_at = ? WHERE id = ?`,
        [dateStr, record.id]
      );
    }

    // Get sample of updated records
    const [walkInSample] = await db.query(`
      SELECT id, guest_name, created_at
      FROM walk_in_bookings
      ORDER BY id DESC
      LIMIT 5
    `);

    const [dayPassSample] = await db.query(`
      SELECT id, representative_name, created_at
      FROM day_pass_walk_in
      ORDER BY id DESC
      LIMIT 5
    `);

    res.json({ 
      success: true, 
      message: `Updated ${(walkInRecords as any[]).length} walk-in room bookings and ${(dayPassRecords as any[]).length} day pass walk-ins`,
      walkInCount: (walkInRecords as any[]).length,
      dayPassCount: (dayPassRecords as any[]).length,
      walkInSample,
      dayPassSample
    });
  } catch (error) {
    console.error('Fix walk-in times error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fix walk-in times',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
