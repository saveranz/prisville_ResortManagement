import { RequestHandler } from "express";
import db from "../db";

// Remove duplicate day pass walk-ins (admin only)
export const removeDayPassDuplicates: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin only' 
      });
      return;
    }

    // Get count before
    const [beforeCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const before = (beforeCount as any)[0].count;

    // Find and keep only the first occurrence of each duplicate
    // Duplicates are defined as same: representative_name, number_of_pax, cottage_type, time_of_day, total_amount, and same date (not time)
    await db.query(`
      DELETE t1 FROM day_pass_walk_in t1
      INNER JOIN day_pass_walk_in t2 
      WHERE 
        t1.id > t2.id
        AND t1.representative_name = t2.representative_name
        AND t1.number_of_pax = t2.number_of_pax
        AND t1.cottage_type = t2.cottage_type
        AND t1.time_of_day = t2.time_of_day
        AND t1.total_amount = t2.total_amount
        AND DATE(t1.created_at) = DATE(t2.created_at)
    `);

    // Get count after
    const [afterCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const after = (afterCount as any)[0].count;

    res.json({ 
      success: true, 
      message: 'Duplicates removed successfully',
      before,
      after,
      removed: before - after
    });
  } catch (error) {
    console.error('Remove duplicates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove duplicates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
