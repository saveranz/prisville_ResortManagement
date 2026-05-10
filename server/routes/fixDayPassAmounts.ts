import { RequestHandler } from "express";
import db from "../db";

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Fix day pass walk-in amounts with correct pricing
export const fixDayPassAmounts: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin or receptionist
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Staff access required' 
      });
      return;
    }

    // Get all day pass walk-in records
    const [records] = await db.query(`
      SELECT 
        id,
        representative_name,
        number_of_pax,
        cottage_type,
        time_of_day,
        total_amount as old_amount
      FROM day_pass_walk_in
    `);

    console.log(`Found ${(records as any[]).length} day pass walk-in records to fix`);

    // Update all amounts with correct calculation
    const [updateResult] = await db.query(`
      UPDATE day_pass_walk_in
      SET total_amount = CASE 
        WHEN time_of_day = 'day' THEN 500 + (100 * number_of_pax)
        WHEN time_of_day = 'night' THEN 600 + (150 * number_of_pax)
        ELSE total_amount
      END
    `);

    // Get updated records
    const [updatedRecords] = await db.query(`
      SELECT 
        id,
        representative_name,
        number_of_pax,
        cottage_type,
        time_of_day,
        total_amount as new_amount
      FROM day_pass_walk_in
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json({ 
      success: true, 
      message: `Fixed ${(updateResult as any).affectedRows} day pass walk-in amounts`,
      affectedRows: (updateResult as any).affectedRows,
      sampleRecords: updatedRecords,
      pricing: {
        day: '₱500 cottage + ₱100 per pax',
        night: '₱600 cottage + ₱150 per pax'
      }
    });
  } catch (error) {
    console.error('Fix day pass amounts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fix day pass amounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
