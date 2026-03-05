import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Get all inventory items
export const getInventoryItems: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Only receptionist and admin can access
    if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [items] = await db.query<RowDataPacket[]>(
      `SELECT * FROM inventory_items ORDER BY id DESC`
    );

    return res.json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch inventory" });
  }
};

// Add new inventory item
export const addInventoryItem: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { item_name, category, quantity, unit, unit_price } = req.body;

    if (!item_name || !category || !quantity || !unit || !unit_price) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) 
       VALUES (?, ?, ?, ?, ?)`,
      [item_name, category, parseInt(quantity), unit, `₱${parseFloat(unit_price)}`]
    );

    return res.json({
      success: true,
      message: "Item added successfully",
      itemId: result.insertId
    });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return res.status(500).json({ success: false, message: "Failed to add item" });
  }
};

// Update inventory quantity
export const updateInventoryQuantity: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { itemId, change } = req.body;

    if (!itemId || change === undefined) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Get current quantity
    const [items] = await db.query<RowDataPacket[]>(
      `SELECT quantity FROM inventory_items WHERE id = ?`,
      [itemId]
    );

    if (items.length === 0) {
      return res.json({ success: false, message: "Item not found" });
    }

    const newQuantity = items[0].quantity + parseInt(change);

    if (newQuantity < 0) {
      return res.json({ success: false, message: "Cannot have negative quantity" });
    }

    await db.query(
      `UPDATE inventory_items SET quantity = ?, last_updated = NOW() WHERE id = ?`,
      [newQuantity, itemId]
    );

    return res.json({
      success: true,
      message: "Quantity updated successfully"
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    return res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};

// Get all transactions
export const getTransactions: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [transactions] = await db.query<RowDataPacket[]>(
      `SELECT * FROM financial_transactions ORDER BY transaction_date DESC, created_at DESC`
    );

    return res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// Add new transaction
export const addTransaction: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { type, category, description, amount, transaction_date } = req.body;

    if (!type || !category || !description || !amount || !transaction_date) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financial_transactions (type, category, description, amount, transaction_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [type, category, description, `₱${parseFloat(amount)}`, transaction_date]
    );

    return res.json({
      success: true,
      message: "Transaction added successfully",
      transactionId: result.insertId
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return res.status(500).json({ success: false, message: "Failed to add transaction" });
  }
};
