/**
 * Script to insert day pass walk-in historical data
 * Run this from your project root: npx tsx database/insert-day-pass-data.ts
 */

import db from '../server/db';

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

async function insertData() {
  try {
    console.log('🔄 Starting data insertion...');
    console.log(`📊 Total records to insert: ${data.length}`);
    
    // Check current count
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const currentCount = (countResult as any)[0].count;
    console.log(`📋 Current records in database: ${currentCount}`);
    
    if (currentCount > 0) {
      console.log('⚠️  Warning: Table already has data. Clear it first? (y/n)');
      console.log('   Run this query manually if you want to clear: DELETE FROM day_pass_walk_in;');
      console.log('   Then run this script again.');
      process.exit(0);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
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
        console.error(`❌ Failed to insert ${record.name}:`, error);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully inserted: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📈 Total: ${data.length}`);
    
    // Verify final count
    const [finalCountResult] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');
    const finalCount = (finalCountResult as any)[0].count;
    console.log(`\n✨ Final database count: ${finalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

insertData();
