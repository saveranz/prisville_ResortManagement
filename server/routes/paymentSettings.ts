import { RequestHandler } from "express";
import { Pool } from "pg";

// You may already have a db pool instance, adjust import as needed
const pool = new Pool();

// GET payment settings
export const getPaymentSettings: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM payment_settings ORDER BY updated_at DESC LIMIT 1");
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No payment settings found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
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
    // Upsert: insert if not exists, else update
    const result = await pool.query(
      `INSERT INTO payment_settings (account_name, mobile_number, note, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET account_name = $1, mobile_number = $2, note = $3, updated_at = NOW()
       RETURNING *`,
      [account_name, mobile_number, note]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update payment settings" });
  }
};
