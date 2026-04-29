import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET payment settings
export const getPaymentSettings: RequestHandler = async (req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM payment_settings ORDER BY updated_at DESC LIMIT 1"
    );
    
    if (rows.length === 0) {
      // Return default values if no settings exist
      return res.json({
        id: null,
        account_name: "Prisville Resort",
        mobile_number: "+63 912 345 6789",
        note: "This is a reservation fee (50% of total) to secure your booking. The remaining balance will be paid upon arrival.",
        updated_at: null
      });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch payment settings:", err);
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
};

// UPDATE payment settings
export const updatePaymentSettings: RequestHandler = async (req, res) => {
  const { account_name, mobile_number, note } = req.body;
  
  if (!account_name || !mobile_number) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  try {
    // Check if settings exist
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM payment_settings LIMIT 1"
    );
    
    if (existing.length === 0) {
      // Insert new settings
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO payment_settings (account_name, mobile_number, note, updated_at)
         VALUES (?, ?, ?, NOW())`,
        [account_name, mobile_number, note || null]
      );
      
      const [newRow] = await db.query<RowDataPacket[]>(
        "SELECT * FROM payment_settings WHERE id = ?",
        [result.insertId]
      );
      
      return res.json(newRow[0]);
    } else {
      // Update existing settings
      await db.query(
        `UPDATE payment_settings 
         SET account_name = ?, mobile_number = ?, note = ?, updated_at = NOW()
         WHERE id = ?`,
        [account_name, mobile_number, note || null, existing[0].id]
      );
      
      const [updatedRow] = await db.query<RowDataPacket[]>(
        "SELECT * FROM payment_settings WHERE id = ?",
        [existing[0].id]
      );
      
      return res.json(updatedRow[0]);
    }
  } catch (err) {
    console.error("Failed to update payment settings:", err);
    res.status(500).json({ error: "Failed to update payment settings" });
  }
};
