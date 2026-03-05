import db from '../server/db';

async function fixEncodingIssue() {
  try {
    console.log('🔧 Fixing character encoding for peso signs...\n');

    // Count how many need fixing first
    const [countRoom] = await db.query(`
      SELECT COUNT(*) as count FROM room_bookings WHERE LENGTH(total_amount) > 10
    `) as any[];
    const [countAmenity] = await db.query(`
      SELECT COUNT(*) as count FROM amenity_bookings WHERE LENGTH(total_amount) > 10
    `) as any[];
    const [countDayPass] = await db.query(`
      SELECT COUNT(*) as count FROM day_pass_bookings WHERE LENGTH(total_amount) > 10
    `) as any[];
    
    console.log(`Found ${countRoom[0].count} room bookings with encoding issues`);
    console.log(`Found ${countAmenity[0].count} amenity bookings with encoding issues`);
    console.log(`Found ${countDayPass[0].count} day pass bookings with encoding issues\n`);

    // Fix room_bookings - extract just the numbers and re-add correct peso sign
    const [roomResult] = await db.query(`
      UPDATE room_bookings 
      SET total_amount = CONCAT('₱', SUBSTRING(total_amount, 4))
      WHERE LENGTH(total_amount) > 10
    `) as any[];
    console.log(`✅ Fixed ${roomResult.affectedRows} room booking prices`);

    // Fix amenity_bookings
    const [amenityResult] = await db.query(`
      UPDATE amenity_bookings 
      SET total_amount = CONCAT('₱', SUBSTRING(total_amount, 4))
      WHERE LENGTH(total_amount) > 10
    `) as any[];
    console.log(`✅ Fixed ${amenityResult.affectedRows} amenity booking prices`);

    // Fix day_pass_bookings
    const [dayPassResult] = await db.query(`
      UPDATE day_pass_bookings 
      SET total_amount = CONCAT('₱', SUBSTRING(total_amount, 4))
      WHERE LENGTH(total_amount) > 10
    `) as any[];
    console.log(`✅ Fixed ${dayPassResult.affectedRows} day pass booking prices`);

    const totalFixed = roomResult.affectedRows + amenityResult.affectedRows + dayPassResult.affectedRows;
    console.log(`\n🎉 Total bookings fixed: ${totalFixed}`);

    // Verify fixes
    console.log('\n📋 Verifying corrected prices:');
    const [samples] = await db.query(`
      SELECT id, total_amount, HEX(total_amount) as hex_value
      FROM room_bookings 
      ORDER BY id DESC
      LIMIT 5
    `) as any[];
    
    samples.forEach((sample: any) => {
      console.log(`   Booking #${sample.id}: ${sample.total_amount} (HEX: ${sample.hex_value})`);
    });

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing encoding:', error);
    process.exit(1);
  }
}

fixEncodingIssue();
