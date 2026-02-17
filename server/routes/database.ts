import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

// Example endpoint to test database connection
export const testDatabase: RequestHandler = async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT 1 + 1 AS result');
    res.json({ 
      success: true, 
      message: 'Database query successful',
      result: rows[0].result 
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
