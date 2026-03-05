import db from '../server/db';

async function fixInventoryPrices() {
  try {
    console.log('🔧 Fixing inventory item prices...\n');

    // Check current state
    const [sampleBefore] = await db.query(`
      SELECT id, item_name, unit_price, quantity, LENGTH(unit_price) as price_length
      FROM inventory_items 
      LIMIT 5
    `) as any[];
    
    console.log('📋 Sample items BEFORE fix:');
    sampleBefore.forEach((item: any) => {
      console.log(`   ${item.item_name}: ${item.unit_price} (length: ${item.price_length})`);
    });
    console.log('');

    // Fix unit_price with corrupted encoding
    const [priceResult] = await db.query(`
      UPDATE inventory_items 
      SET unit_price = CONCAT('₱', SUBSTRING(unit_price, 4))
      WHERE LENGTH(unit_price) > 6 AND unit_price NOT LIKE '₱%'
    `) as any[];
    console.log(`✅ Fixed ${priceResult.affectedRows} item prices`);

    console.log(`\n🎉 Total inventory items fixed: ${priceResult.affectedRows}`);

    // Verify fixes
    console.log('\n📋 Sample items AFTER fix:');
    const [sampleAfter] = await db.query(`
      SELECT id, item_name, unit_price, quantity
      FROM inventory_items 
      ORDER BY id DESC
      LIMIT 5
    `) as any[];
    
    sampleAfter.forEach((item: any) => {
      console.log(`   ${item.item_name}: Price=${item.unit_price}, Qty=${item.quantity}`);
    });

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixInventoryPrices();
