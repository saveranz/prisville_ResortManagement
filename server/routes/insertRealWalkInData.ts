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

    // Walk-in room bookings data
    const walkInBookings = [
      ['Maribel Bicac / Roland Guya', 'Room 101', 'N/A', '09383944767', 2, '2000.00', '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-03 06:00:00'],
      ['Alma P. Miranda', 'Room 102', 'N/A', '09176800527', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-03 07:00:00'],
      ['Alma P. Miranda', 'Room 103', 'N/A', '09176800527', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-03 07:00:00'],
      ['Reynaldo Ruga Uy', 'Room 103', 'N/A', 'N/A', 2, '2000.00', '2000.00', '2000.00', '0.00', 'paid', 0, '2026-04-11 06:00:00'],
      ['Mjay Parafina', 'Room 104', 'N/A', '09999035212', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-20 06:00:00'],
      ['Mjay Parafina', 'Room 105', 'N/A', '09999035212', 2, '2200.00', '2200.00', '2200.00', '0.00', 'paid', 0, '2026-04-20 06:00:00'],
      ['Elizabeth Asi', 'Room 105', 'N/A', '09706741259', 2, '7400.00', '7400.00', '7400.00', '0.00', 'paid', 0, '2026-05-23 06:00:00'],
      ['Elizabeth Asi', 'Room 106', 'N/A', '09706741259', 2, '7400.00', '7400.00', '7400.00', '0.00', 'paid', 0, '2026-05-23 06:00:00']
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
      await db.query('ALTER TABLE walk_in_bookings ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0');
    } catch (error) {
      // Column might already exist, ignore error
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

    // Get final counts
    const [walkInCount] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings WHERE archived = 0');
    const [dayPassCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');

    res.json({ 
      success: true, 
      message: 'Real data inserted successfully',
      walkInInserted,
      dayPassInserted,
      walkInTotal: (walkInCount as any)[0].count,
      dayPassTotal: (dayPassCount as any)[0].count
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
