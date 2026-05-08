import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader } from "mysql2";

// Temporary endpoint to insert day pass walk-in historical data
// DELETE THIS FILE after data is inserted!
export const insertDayPassHistoricalData: RequestHandler = async (req, res) => {
  try {
    // Only allow admin or receptionist to run this
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Admin or receptionist access required' 
      });
      return;
    }

    const data = [
      { name: 'Judith', pax: 22, cottage: 'kubo', time: 'day', amount: 600.00, date: '2026-04-02' },
      { name: 'Francis Bryan L. Aligata', pax: 9, cottage: 'kubo', time: 'day', amount: 400.00, date: '2026-04-03' },
      { name: 'Ronilo Seco', pax: 9, cottage: 'concrete', time: 'day', amount: 400.00, date: '2026-04-04' },
      { name: 'Kier', pax: 17, cottage: 'concrete', time: 'day', amount: 500.00, date: '2026-04-05' },
      { name: 'Gabriel Princes D. Rosas', pax: 13, cottage: 'concrete', time: 'day', amount: 500.00, date: '2026-04-06' },
      { name: 'Dane Urbano', pax: 16, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-07' },
      { name: 'Eli Doce', pax: 8, cottage: 'concrete', time: 'day', amount: 400.00, date: '2026-04-09' },
      { name: 'Mary Rose Arellano', pax: 14, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-10' },
      { name: 'Mary Ann M. Jalac', pax: 16, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-11' },
      { name: 'Andrea', pax: 7, cottage: 'concrete', time: 'day', amount: 400.00, date: '2026-04-12' },
      { name: 'Anthony', pax: 8, cottage: 'concrete', time: 'day', amount: 500.00, date: '2026-04-13' },
      { name: 'Dianne', pax: 19, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-14' },
      { name: 'Queenie', pax: 9, cottage: 'concrete', time: 'day', amount: 500.00, date: '2026-04-15' },
      { name: 'Jessica', pax: 15, cottage: 'concrete', time: 'day', amount: 500.00, date: '2026-04-17' },
      { name: 'Jelo', pax: 12, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-20' },
      { name: 'Nonato M. Sarmiento', pax: 10, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-23' },
      { name: 'Khim', pax: 7, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-24' },
      { name: 'Jhackielyn Libres', pax: 12, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-26' },
      { name: 'Princess', pax: 13, cottage: 'concrete', time: 'day', amount: 400.00, date: '2026-04-27' },
      { name: 'Diane', pax: 14, cottage: 'kubo', time: 'day', amount: 100.00, date: '2026-04-28' },
      { name: 'Jian', pax: 9, cottage: 'kubo', time: 'day', amount: 500.00, date: '2026-04-29' },
      { name: 'Mary Grace Manalo', pax: 10, cottage: 'kubo', time: 'day', amount: 1000.00, date: '2026-05-02' },
      { name: 'Eloisa Villanueva', pax: 15, cottage: 'concrete', time: 'day', amount: 2550.00, date: '2026-05-03' },
      { name: 'Lorena Famerial', pax: 12, cottage: 'concrete', time: 'day', amount: 400.00, date: '2026-05-04' },
    ];

    console.log('🔄 Starting data insertion via API...');
    console.log(`📊 Total records to insert: ${data.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const record of data) {
      try {
        await db.query(
          `INSERT INTO day_pass_walk_in 
          (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [record.name, record.pax, record.cottage, record.time, record.amount, record.date]
        );
        successCount++;
        console.log(`✅ Inserted: ${record.name} (${record.date})`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to insert ${record.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully inserted: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    res.json({ 
      success: true, 
      message: `Inserted ${successCount} out of ${data.length} records`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to insert data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
