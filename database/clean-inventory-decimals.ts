import db from "../server/db";

async function cleanInventoryDecimals() {
  try {
    console.log("🧹 Cleaning inventory price decimals...");

    // Get all items with .00 in their prices
    const [items] = await db.query<any[]>(
      `SELECT id, item_name, unit_price FROM inventory_items WHERE unit_price LIKE '%.00'`
    );

    console.log(`📋 Found ${items.length} items with .00 decimals`);

    if (items.length === 0) {
      console.log("✅ No items need cleaning!");
      process.exit(0);
    }

    // Update each item to remove .00
    for (const item of items) {
      const cleanPrice = item.unit_price.replace(/\.00$/, '');
      await db.query(
        `UPDATE inventory_items SET unit_price = ? WHERE id = ?`,
        [cleanPrice, item.id]
      );
      console.log(`  ✓ ${item.item_name}: ${item.unit_price} → ${cleanPrice}`);
    }

    console.log(`\n🎉 Cleaned ${items.length} inventory prices!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanInventoryDecimals();
