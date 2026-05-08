import { RequestHandler } from "express";
import db from "../db";

// Remove duplicate walk-ins (admin only)
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

    // Get counts before
    const [walkInBefore] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings WHERE archived = 0');
    const [dayPassBefore] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const walkInBeforeCount = (walkInBefore as any)[0].count;
    const dayPassBeforeCount = (dayPassBefore as any)[0].count;

    // Remove walk-in room booking duplicates
    await db.query(`
      DELETE t1 FROM walk_in_bookings t1
      INNER JOIN walk_in_bookings t2 
      WHERE 
        t1.id > t2.id
        AND t1.guest_name = t2.guest_name
        AND t1.room_number = t2.room_number
        AND t1.contact_number = t2.contact_number
        AND t1.number_of_pax = t2.number_of_pax
        AND t1.total_amount = t2.total_amount
        AND DATE(t1.created_at) = DATE(t2.created_at)
        AND t1.archived = 0
        AND t2.archived = 0
    `);

    // Remove day pass walk-in duplicates
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

    // Get counts after
    const [walkInAfter] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings WHERE archived = 0');
    const [dayPassAfter] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const walkInAfterCount = (walkInAfter as any)[0].count;
    const dayPassAfterCount = (dayPassAfter as any)[0].count;

    res.json({ 
      success: true, 
      message: 'Duplicates removed successfully',
      walkInBookings: {
        before: walkInBeforeCount,
        after: walkInAfterCount,
        removed: walkInBeforeCount - walkInAfterCount
      },
      dayPassWalkIns: {
        before: dayPassBeforeCount,
        after: dayPassAfterCount,
        removed: dayPassBeforeCount - dayPassAfterCount
      }
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
