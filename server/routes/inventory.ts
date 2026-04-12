import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Get all inventory items
export const getInventoryItems: RequestHandler = async (req, res) => {
  try {
    // Optionally filter archived items
    const showArchived = req.query.showArchived === '1' || req.query.showArchived === 'true';
    let query = 'SELECT * FROM inventory_items';
    if (!showArchived) {
      query += ' WHERE archived = 0';
    }
    query += ' ORDER BY id DESC';
    const [items] = await db.query<RowDataPacket[]>(query);
    return res.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch inventory" });
  }
};

// Get inventory stats/summary
export const getInventoryStats: RequestHandler = async (req, res) => {
  try {
    const [totals] = await db.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity <= min_stock AND min_stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon_count,
        COUNT(DISTINCT category) as total_categories
       FROM inventory_items WHERE archived = 0`
    );

    // Get top used items (most issued in last 30 days)
    const [topUsed] = await db.query<RowDataPacket[]>(
      `SELECT i.item_name, i.category, SUM(t.quantity) as total_issued
       FROM inventory_transactions t
       JOIN inventory_items i ON t.item_id = i.id
       WHERE t.type = 'issued' AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY t.item_id
       ORDER BY total_issued DESC
       LIMIT 5`
    );

    // Monthly cost (received items value in last 30 days)
    const [monthlyCost] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(t.quantity * CAST(REPLACE(REPLACE(i.unit_price, '₱', ''), ',', '') AS DECIMAL(10,2))), 0) as monthly_cost
       FROM inventory_transactions t
       JOIN inventory_items i ON t.item_id = i.id
       WHERE t.type = 'received' AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    return res.json({
      success: true,
      stats: {
        ...totals[0],
        monthly_cost: monthlyCost[0]?.monthly_cost || 0,
        top_used: topUsed
      }
    });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// Add new inventory item
export const addInventoryItem: RequestHandler = async (req, res) => {
  try {
    const { item_name, category, quantity, unit, unit_price, min_stock, supplier, expiry_date } = req.body;

    if (!item_name || !category || !quantity || !unit || !unit_price) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price, min_stock, supplier, expiry_date, archived) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [item_name, category, parseInt(quantity), unit, `₱${parseFloat(unit_price)}`, parseInt(min_stock) || 0, supplier || null, expiry_date || null]
    );

    // Record initial stock as a "received" transaction
    if (parseInt(quantity) > 0) {
      await db.query(
        `INSERT INTO inventory_transactions (item_id, type, quantity, performed_by, supplier, notes) VALUES (?, 'received', ?, ?, ?, 'Initial stock')`,
        [result.insertId, parseInt(quantity), req.session.userEmail || 'system', supplier || null]
      );
    }

    return res.json({ success: true, message: "Item added successfully", itemId: result.insertId });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return res.status(500).json({ success: false, message: "Failed to add item" });
  }
};

// Update inventory item details
export const updateInventoryItem: RequestHandler = async (req, res) => {
  try {
    const { itemId, item_name, category, unit, unit_price, min_stock, supplier, expiry_date } = req.body;

    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    await db.query(
      `UPDATE inventory_items SET item_name = ?, category = ?, unit = ?, unit_price = ?, min_stock = ?, supplier = ?, expiry_date = ?, last_updated = NOW() WHERE id = ?`,
      [item_name, category, unit, `₱${parseFloat(unit_price)}`, parseInt(min_stock) || 0, supplier || null, expiry_date || null, itemId]
    );

    return res.json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return res.status(500).json({ success: false, message: "Failed to update item" });
  }
};

// Delete inventory item
export const deleteInventoryItem: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    // Archive instead of delete
    await db.query(`UPDATE inventory_items SET archived = 1, last_updated = NOW() WHERE id = ?`, [itemId]);
    return res.json({ success: true, message: "Item archived successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return res.status(500).json({ success: false, message: "Failed to delete item" });
  }
};

// Receive stock (increase quantity + record transaction)
export const receiveStock: RequestHandler = async (req, res) => {
  try {
    const { itemId, quantity, supplier, notes } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.json({ success: false, message: "Item ID and valid quantity are required" });
    }

    await db.query(
      `UPDATE inventory_items SET quantity = quantity + ?, last_updated = NOW() WHERE id = ?`,
      [parseInt(quantity), itemId]
    );

    await db.query(
      `INSERT INTO inventory_transactions (item_id, type, quantity, performed_by, supplier, notes) VALUES (?, 'received', ?, ?, ?, ?)`,
      [itemId, parseInt(quantity), req.session.userEmail || 'system', supplier || null, notes || null]
    );

    return res.json({ success: true, message: "Stock received successfully" });
  } catch (error) {
    console.error("Error receiving stock:", error);
    return res.status(500).json({ success: false, message: "Failed to receive stock" });
  }
};

// Issue stock (decrease quantity + record transaction)
export const issueStock: RequestHandler = async (req, res) => {
  try {
    const { itemId, quantity, notes } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.json({ success: false, message: "Item ID and valid quantity are required" });
    }

    const [items] = await db.query<RowDataPacket[]>(
      `SELECT quantity FROM inventory_items WHERE id = ?`, [itemId]
    );

    if (items.length === 0) {
      return res.json({ success: false, message: "Item not found" });
    }

    if (items[0].quantity < parseInt(quantity)) {
      return res.json({ success: false, message: "Insufficient stock" });
    }

    await db.query(
      `UPDATE inventory_items SET quantity = quantity - ?, last_updated = NOW() WHERE id = ?`,
      [parseInt(quantity), itemId]
    );

    await db.query(
      `INSERT INTO inventory_transactions (item_id, type, quantity, performed_by, notes) VALUES (?, 'issued', ?, ?, ?)`,
      [itemId, parseInt(quantity), req.session.userEmail || 'system', notes || null]
    );

    return res.json({ success: true, message: "Stock issued successfully" });
  } catch (error) {
    console.error("Error issuing stock:", error);
    return res.status(500).json({ success: false, message: "Failed to issue stock" });
  }
};

// Get inventory transactions (receiving/issuance log)
export const getInventoryTransactions: RequestHandler = async (req, res) => {
  try {
    const [transactions] = await db.query<RowDataPacket[]>(
      `SELECT t.*, i.item_name, i.unit, i.category
       FROM inventory_transactions t
       JOIN inventory_items i ON t.item_id = i.id
       ORDER BY t.created_at DESC
       LIMIT 200`
    );

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching inventory transactions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// Update inventory quantity (legacy +/- buttons)
export const updateInventoryQuantity: RequestHandler = async (req, res) => {
  try {
    const { itemId, change } = req.body;

    if (!itemId || change === undefined) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const [items] = await db.query<RowDataPacket[]>(
      `SELECT quantity FROM inventory_items WHERE id = ?`, [itemId]
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

    // Record the transaction
    const type = parseInt(change) > 0 ? 'received' : 'issued';
    await db.query(
      `INSERT INTO inventory_transactions (item_id, type, quantity, performed_by, notes) VALUES (?, ?, ?, ?, 'Manual adjustment')`,
      [itemId, type, Math.abs(parseInt(change)), req.session.userEmail || 'system']
    );

    return res.json({ success: true, message: "Quantity updated successfully" });
  } catch (error) {
    console.error("Error updating quantity:", error);
    return res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};

// Get all financial transactions (kept for backward compatibility)
export const getTransactions: RequestHandler = async (req, res) => {
  try {
    const [transactions] = await db.query<RowDataPacket[]>(
      `SELECT * FROM financial_transactions ORDER BY transaction_date DESC, created_at DESC`
    );

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// Add new financial transaction
export const addTransaction: RequestHandler = async (req, res) => {
  try {
    const { type, category, description, amount, transaction_date } = req.body;

    if (!type || !category || !description || !amount || !transaction_date) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financial_transactions (type, category, description, amount, transaction_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [type, category, description, `₱${parseFloat(amount)}`, transaction_date]
    );

    return res.json({ success: true, message: "Transaction added successfully", transactionId: result.insertId });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return res.status(500).json({ success: false, message: "Failed to add transaction" });
  }
};
