import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Create a new booking issue
export const createBookingIssue: RequestHandler = async (req, res) => {
  try {
    const { bookingId, bookingType, userEmail, issueType, priority, subject, description } = req.body;

    if (!bookingId || !bookingType || !userEmail || !issueType || !subject || !description) {
      res.status(400).json({ success: false, message: 'All required fields must be provided' });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO booking_issues (booking_id, booking_type, user_email, issue_type, priority, subject, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, bookingType, userEmail, issueType, priority || 'medium', subject, description]
    );

    res.json({ 
      success: true, 
      message: 'Issue reported successfully',
      issueId: result.insertId
    });
  } catch (error) {
    console.error('Create booking issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking issue' });
  }
};

// Get all booking issues
export const getAllBookingIssues: RequestHandler = async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = 'SELECT * FROM booking_issues WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY priority DESC, created_at DESC';

    const [issues] = await db.query<RowDataPacket[]>(query, params);

    res.json({ success: true, issues });
  } catch (error) {
    console.error('Get booking issues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking issues' });
  }
};

// Get booking issues for a specific user
export const getUserBookingIssues: RequestHandler = async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      res.status(400).json({ success: false, message: 'User email is required' });
      return;
    }

    const [issues] = await db.query<RowDataPacket[]>(
      `SELECT * FROM booking_issues 
       WHERE user_email = ? 
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json({ success: true, issues });
  } catch (error) {
    console.error('Get user booking issues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user booking issues' });
  }
};

// Get issue by ID
export const getBookingIssueById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [issues] = await db.query<RowDataPacket[]>(
      `SELECT * FROM booking_issues WHERE id = ?`,
      [id]
    );

    if (issues.length === 0) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }

    res.json({ success: true, issue: issues[0] });
  } catch (error) {
    console.error('Get booking issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking issue' });
  }
};

// Update booking issue status
export const updateBookingIssueStatus: RequestHandler = async (req, res) => {
  try {
    const { issueId, status, resolution } = req.body;

    if (!issueId || !status) {
      res.status(400).json({ success: false, message: 'Issue ID and status are required' });
      return;
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (resolution) {
      updates.push('resolution = ?');
      values.push(resolution);
    }

    if (status === 'resolved' || status === 'closed') {
      updates.push('resolved_at = NOW()');
      if (req.session.userId) {
        updates.push('resolved_by = ?');
        values.push(req.session.userId);
      }
    }

    values.push(issueId);

    await db.query(
      `UPDATE booking_issues SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Issue status updated successfully' });
  } catch (error) {
    console.error('Update booking issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking issue' });
  }
};

// Update booking issue priority
export const updateBookingIssuePriority: RequestHandler = async (req, res) => {
  try {
    const { issueId, priority } = req.body;

    if (!issueId || !priority) {
      res.status(400).json({ success: false, message: 'Issue ID and priority are required' });
      return;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority' });
      return;
    }

    await db.query(
      `UPDATE booking_issues SET priority = ? WHERE id = ?`,
      [priority, issueId]
    );

    res.json({ success: true, message: 'Issue priority updated successfully' });
  } catch (error) {
    console.error('Update issue priority error:', error);
    res.status(500).json({ success: false, message: 'Failed to update issue priority' });
  }
};

// Delete booking issue
export const deleteBookingIssue: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM booking_issues WHERE id = ?', [id]);

    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete booking issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking issue' });
  }
};
