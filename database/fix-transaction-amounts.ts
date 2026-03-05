import db from "../server/db";

async function fixTransactionAmounts() {
  try {
    console.log("🔧 Fixing transaction amounts encoding...");

    // Get all transactions with corrupted amounts
    const [transactions] = await db.query<any[]>(
      `SELECT id, description, amount FROM financial_transactions WHERE LENGTH(amount) > 10`
    );

    console.log(`📋 Found ${transactions.length} transactions with potential encoding issues`);

    if (transactions.length === 0) {
      console.log("✅ No transactions need fixing!");
      process.exit(0);
    }

    // Show samples before fix
    console.log("\n📋 Sample transactions BEFORE fix:");
    transactions.slice(0, 5).forEach(t => {
      console.log(`   ${t.description}: ${t.amount} (length: ${t.amount.length})`);
    });

    // Fix each transaction
    const updatePromises = transactions.map(transaction => {
      const cleanAmount = `₱${transaction.amount.substring(3)}`;
      return db.query(
        `UPDATE financial_transactions SET amount = ? WHERE id = ?`,
        [cleanAmount, transaction.id]
      );
    });

    await Promise.all(updatePromises);

    // Get samples after fix
    const [afterSamples] = await db.query<any[]>(
      `SELECT description, amount FROM financial_transactions ORDER BY id DESC LIMIT 5`
    );

    console.log(`\n✅ Fixed ${transactions.length} transaction amounts!`);
    console.log("\n📋 Sample transactions AFTER fix:");
    afterSamples.forEach(t => {
      console.log(`   ${t.description}: ${t.amount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixTransactionAmounts();
