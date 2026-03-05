import db from '../server/db';

async function inspectPrices() {
  try {
    console.log('🔍 Inspecting actual price values in database...\n');

    const [roomBookings] = await db.query(`
      SELECT id, total_amount, LENGTH(total_amount) as length, HEX(total_amount) as hex_value
      FROM room_bookings 
      ORDER BY id DESC
      LIMIT 10
    `) as any[];

    console.log('📋 Room Bookings (most recent 10):');
    roomBookings.forEach((booking: any) => {
      console.log(`   ID: ${booking.id}`);
      console.log(`   Display: "${booking.total_amount}"`);
      console.log(`   Length: ${booking.length} characters`);
      console.log(`   HEX: ${booking.hex_value}`);
      console.log(`   First 10 chars: "${booking.total_amount.substring(0, 10)}"`);
      console.log('');
    });

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectPrices();
