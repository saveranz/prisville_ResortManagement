import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Get stay history for a user
export const getUserStayHistory: RequestHandler = async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      res.status(400).json({ success: false, message: 'User email is required' });
      return;
    }

    const [history] = await db.query<RowDataPacket[]>(
      `SELECT * FROM stay_history 
       WHERE user_email = ? 
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error('Get stay history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stay history' });
  }
};

// Get all stay history (for staff)
export const getAllStayHistory: RequestHandler = async (req, res) => {
  try {
    const [history] = await db.query<RowDataPacket[]>(
      `SELECT * FROM stay_history 
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error('Get all stay history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stay history' });
  }
};

// Get guest statistics
export const getGuestStatistics: RequestHandler = async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      res.status(400).json({ success: false, message: 'User email is required' });
      return;
    }

    const [stats] = await db.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_stays,
        SUM(nights_stayed) as total_nights,
        SUM(total_spent) as total_spent,
        AVG(rating) as average_rating,
        MAX(actual_check_out) as last_visit
       FROM stay_history 
       WHERE user_email = ?`,
      [userEmail]
    );

    const [recentStays] = await db.query<RowDataPacket[]>(
      `SELECT * FROM stay_history 
       WHERE user_email = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userEmail]
    );

    res.json({ 
      success: true, 
      statistics: stats[0],
      recentStays
    });
  } catch (error) {
    console.error('Get guest statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch guest statistics' });
  }
};

// Update stay history notes or rating
export const updateStayHistory: RequestHandler = async (req, res) => {
  try {
    const { stayId, guestNotes, staffNotes, rating } = req.body;

    if (!stayId) {
      res.status(400).json({ success: false, message: 'Stay ID is required' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (guestNotes !== undefined) {
      updates.push('guest_notes = ?');
      values.push(guestNotes);
    }

    if (staffNotes !== undefined) {
      updates.push('staff_notes = ?');
      values.push(staffNotes);
    }

    if (rating !== undefined) {
      updates.push('rating = ?');
      values.push(rating);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No updates provided' });
      return;
    }

    values.push(stayId);

    await db.query(
      `UPDATE stay_history SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Stay history updated successfully' });
  } catch (error) {
    console.error('Update stay history error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stay history' });
  }
};
