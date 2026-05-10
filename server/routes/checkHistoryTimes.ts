import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - Check what times are actually in the database
export const checkHistoryTimes: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    // Get stay_history records
    const [stayHistory] = await db.query(`
      SELECT 
        id,
        booking_type,
        actual_check_in,
        actual_check_out,
        DATE_FORMAT(actual_check_in, '%Y-%m-%d %H:%i:%s') as check_in_formatted,
        DATE_FORMAT(actual_check_out, '%Y-%m-%d %H:%i:%s') as check_out_formatted
      FROM stay_history
      WHERE actual_check_in IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `);

    // Get walk-in bookings
    const [walkIns] = await db.query(`
      SELECT 
        id,
        guest_name,
        created_at,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_formatted
      FROM walk_in_bookings
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json({ 
      success: true,
      stayHistory,
      walkIns,
      serverTime: new Date().toISOString(),
      serverTimePhilippine: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    });
  } catch (error) {
    console.error('Check history times error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check history times',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
