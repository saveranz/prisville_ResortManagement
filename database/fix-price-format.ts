import db from '../server/db';

async function fixPriceFormat() {
  try {
    console.log('🔧 Fixing price format in all booking tables...\n');

    // Fix room_bookings
    const [roomResult] = await db.query(`
      UPDATE room_bookings 
      SET total_amount = REPLACE(total_amount, '0₱', '₱')
      WHERE total_amount LIKE '0₱%'
    `) as any[];
    console.log(`✅ Fixed ${roomResult.affectedRows} room booking prices`);

    // Fix amenity_bookings
    const [amenityResult] = await db.query(`
      UPDATE amenity_bookings 
      SET total_amount = REPLACE(total_amount, '0₱', '₱')
      WHERE total_amount LIKE '0₱%'
    `) as any[];
    console.log(`✅ Fixed ${amenityResult.affectedRows} amenity booking prices`);

    // Fix day_pass_bookings
    const [dayPassResult] = await db.query(`
      UPDATE day_pass_bookings 
      SET total_amount = REPLACE(total_amount, '0₱', '₱')
      WHERE total_amount LIKE '0₱%'
    `) as any[];
    console.log(`✅ Fixed ${dayPassResult.affectedRows} day pass booking prices`);

    const totalFixed = roomResult.affectedRows + amenityResult.affectedRows + dayPassResult.affectedRows;
    console.log(`\n🎉 Total bookings fixed: ${totalFixed}`);

    // Show sample corrected prices
    console.log('\n📋 Sample corrected prices:');
    const [samples] = await db.query(`
      SELECT id, total_amount, 'room' as type FROM room_bookings 
      WHERE total_amount LIKE '₱%'
      LIMIT 5
    `) as any[];
    
    samples.forEach((sample: any) => {
      console.log(`   ${sample.type} booking #${sample.id}: ${sample.total_amount}`);
    });

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing prices:', error);
    process.exit(1);
  }
}

fixPriceFormat();
