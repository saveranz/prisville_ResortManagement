import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader } from "mysql2";

// Insert real walk-in data (admin only - use once!)
export const insertRealWalkInData: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin only' 
      });
      return;
    }

    // Walk-in room bookings data (CORRECT DATA - 10 records)
    const walkInBookings = [
      ['Elizabeth Asi', 'Room 101', 'N/A', '09706741259', 10, '7400.00', '7400.00', '7400.00', '0.00', 'paid', 0, '2026-03-29 00:00:00'],
      ['Eden Rose Refugia', 'Room 104', 'N/A', '09565115965', 2, '4000.00', '4000.00', '2000.00', '2000.00', 'paid', 0, '2026-03-30 00:00:00'],
      ['Raul Palentinos', 'Room 108', 'N/A', '09668007495', 10, '7000.00', '7000.00', '4500.00', '2500.00', 'paid', 0, '2026-03-31 00:00:00'],
      ['Eden', 'Room 102', 'N/A', '09655543278', 2, '1000.00', '1000.00', '1000.00', '0.00', 'paid', 0, '2026-04-01 00:00:00'],
      ['Xyrus Emmanuel V. Gaton', 'Room 103', 'N/A', '09651888700', 6, '4000.00', '4000.00', '4000.00', '0.00', 'paid', 0, '2026-04-03 00:00:00'],
      ['Michael Jusayan', 'Room 105', 'N/A', '09657220735', 2, '2000.00', '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-05 00:00:00'],
      ['Maribel Bicac / Roland Guya', 'Room 106', 'N/A', '09383944767', 2, '0.00', '0.00', '0.00', '0.00', 'paid', 0, '2026-04-07 00:00:00'], // CANCELLED
      ['Alma P. Miranda', 'Room 107', 'N/A', '09176800527', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-10 00:00:00'],
      ['Reynaldo Ruga Uy', 'Room 101', 'N/A', '09899998901', 2, '2000.00', '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-14 00:00:00'],
      ['Mjay Parafina', 'Room 102', 'N/A', '09999035212', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-20 00:00:00']
    ];

    // Day pass walk-in data
    const dayPassWalkIns = [
      ['Judith', 22, 'kubo', 'day', '600.00', '2026-04-01 16:00:00'],
      ['Francis Bryan L. Aligata', 9, 'kubo', 'day', '400.00', '2026-04-02 16:00:00'],
      ['Ronilo Seco', 9, 'concrete', 'day', '400.00', '2026-04-03 16:00:00'],
      ['Kier', 17, 'concrete', 'day', '500.00', '2026-04-04 16:00:00'],
      ['Gabriel Princes D. Rosas', 13, 'concrete', 'day', '500.00', '2026-04-05 16:00:00'],
      ['Dane Urbano', 16, 'kubo', 'day', '500.00', '2026-04-06 16:00:00'],
      ['Eli Doce', 8, 'concrete', 'day', '400.00', '2026-04-08 16:00:00'],
      ['Mary Rose Arellano', 14, 'kubo', 'day', '500.00', '2026-04-09 16:00:00'],
      ['Mary Ann M. Jalac', 16, 'kubo', 'day', '500.00', '2026-04-10 16:00:00'],
      ['Andrea', 7, 'concrete', 'day', '400.00', '2026-04-11 16:00:00'],
      ['Anthony', 8, 'concrete', 'day', '500.00', '2026-04-12 16:00:00'],
      ['Dianne', 19, 'kubo', 'day', '500.00', '2026-04-13 16:00:00'],
      ['Queenie', 9, 'concrete', 'day', '500.00', '2026-04-14 16:00:00'],
      ['Jessica', 15, 'concrete', 'day', '500.00', '2026-04-16 16:00:00'],
      ['Jelo', 12, 'kubo', 'day', '500.00', '2026-04-19 16:00:00'],
      ['Nonato M. Sarmiento', 10, 'kubo', 'day', '500.00', '2026-04-22 16:00:00'],
      ['Khim', 7, 'kubo', 'day', '500.00', '2026-04-23 16:00:00'],
      ['Jhackielyn Libres', 12, 'kubo', 'day', '500.00', '2026-04-25 16:00:00'],
      ['Princess', 13, 'concrete', 'day', '400.00', '2026-04-26 16:00:00'],
      ['Diane', 14, 'kubo', 'day', '100.00', '2026-04-27 16:00:00'],
      ['Jian', 9, 'kubo', 'day', '500.00', '2026-04-28 16:00:00'],
      ['Mary Grace Manalo', 10, 'kubo', 'day', '1000.00', '2026-05-01 16:00:00'],
      ['Eloisa Villanueva', 15, 'concrete', 'day', '2550.00', '2026-05-02 16:00:00'],
      ['Lorena Famerial', 12, 'concrete', 'day', '400.00', '2026-05-03 16:00:00']
    ];

    // First, add archived column if it doesn't exist
    try {
      await db.query('ALTER TABLE walk_in_bookings ADD COLUMN archived TINYINT(1) DEFAULT 0');
      console.log('Added archived column');
    } catch (error: any) {
      // Column might already exist
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding archived column:', error);
      }
    }

    // Insert walk-in bookings
    let walkInInserted = 0;
    for (const booking of walkInBookings) {
      try {
        await db.query(
          `INSERT INTO walk_in_bookings (guest_name, room_number, address, contact_number, number_of_pax, amount, total_amount, down_payment, balance, payment_status, archived, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          booking
        );
        walkInInserted++;
      } catch (error) {
        console.error('Error inserting walk-in booking:', error);
      }
    }

    // Insert day pass walk-ins
    let dayPassInserted = 0;
    for (const dayPass of dayPassWalkIns) {
      try {
        await db.query(
          `INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          dayPass
        );
        dayPassInserted++;
      } catch (error) {
        console.error('Error inserting day pass walk-in:', error);
      }
    }

    // Get final counts - check if archived column exists first
    let walkInTotal = 0;
    try {
      const [walkInCount] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings WHERE archived = 0');
      walkInTotal = (walkInCount as any)[0].count;
    } catch (error) {
      // If archived column doesn't exist, just count all
      const [walkInCount] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings');
      walkInTotal = (walkInCount as any)[0].count;
    }
    
    const [dayPassCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const dayPassTotal = (dayPassCount as any)[0].count;

    res.json({ 
      success: true, 
      message: 'Real data inserted successfully',
      walkInInserted,
      dayPassInserted,
      walkInTotal,
      dayPassTotal
    });
  } catch (error) {
    console.error('Insert real data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to insert data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
