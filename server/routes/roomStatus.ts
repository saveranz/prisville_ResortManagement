import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Get all room statuses
export const getAllRoomStatus: RequestHandler = async (req, res) => {
  try {
    const [rooms] = await db.query<RowDataPacket[]>(
      `SELECT * FROM room_status ORDER BY room_numbers ASC`
    );

    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch room status' });
  }
};

// Update room status
export const updateRoomStatus: RequestHandler = async (req, res) => {
  try {
    const { roomNumbers, status, notes } = req.body;

    if (!roomNumbers || !status) {
      res.status(400).json({ success: false, message: 'Room numbers and status are required' });
      return;
    }

    const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'out_of_order'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    await db.query(
      `UPDATE room_status SET status = ?, notes = ?, updated_at = NOW() WHERE room_numbers = ?`,
      [status, notes || null, roomNumbers]
    );

    res.json({ success: true, message: 'Room status updated successfully' });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update room status' });
  }
};

// Mark room as cleaned
export const markRoomCleaned: RequestHandler = async (req, res) => {
  try {
    const { roomNumbers } = req.body;

    if (!roomNumbers) {
      res.status(400).json({ success: false, message: 'Room numbers are required' });
      return;
    }

    await db.query(
      `UPDATE room_status SET status = 'available', last_cleaned = NOW(), updated_at = NOW() WHERE room_numbers = ?`,
      [roomNumbers]
    );

    res.json({ success: true, message: 'Room marked as cleaned' });
  } catch (error) {
    console.error('Mark room cleaned error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark room as cleaned' });
  }
};

// Get room status by room numbers
export const getRoomStatusByNumbers: RequestHandler = async (req, res) => {
  try {
    const { roomNumbers } = req.query;

    if (!roomNumbers) {
      res.status(400).json({ success: false, message: 'Room numbers are required' });
      return;
    }

    const [rooms] = await db.query<RowDataPacket[]>(
      `SELECT * FROM room_status WHERE room_numbers = ?`,
      [roomNumbers]
    );

    res.json({ success: true, room: rooms[0] || null });
  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch room status' });
  }
};
