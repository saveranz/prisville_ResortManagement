import db from "../server/db";

async function fixRemainingCorruptedTransactions() {
  try {
    console.log("🔧 Fixing remaining corrupted transaction amounts...\n");

    // Find transactions with corrupted encoding by checking HEX pattern
    // The corrupted pattern starts with C394C3A9E296 (Ôé▒)
    const [transactions] = await db.query<any[]>(
      `SELECT id, type, description, amount, HEX(amount) as hex_value 
       FROM financial_transactions 
       WHERE HEX(amount) LIKE 'C394C3A9E296%'`
    );

    console.log(`📋 Found ${transactions.length} transactions with corrupted encoding:`);

    if (transactions.length === 0) {
      console.log("✅ No corrupted transactions found!");
      process.exit(0);
    }

    transactions.forEach(t => {
      console.log(`   ID ${t.id} [${t.type}]: "${t.amount}"`);
    });

    console.log("\n🔧 Fixing corrupted amounts...");

    // Fix each corrupted transaction
    for (const transaction of transactions) {
      // Remove first 3 corrupted bytes and add proper peso sign
      const cleanAmount = `₱${transaction.amount.substring(3)}`;
      await db.query(
        `UPDATE financial_transactions SET amount = ? WHERE id = ?`,
        [cleanAmount, transaction.id]
      );
      console.log(`   ✓ ID ${transaction.id}: ${transaction.amount} → ${cleanAmount}`);
    }

    console.log(`\n✅ Fixed ${transactions.length} corrupted transaction amounts!`);

    // Verify the fix
    const [verifyIncome] = await db.query<any[]>(
      `SELECT SUM(CAST(REPLACE(REPLACE(amount, '₱', ''), ',', '') AS DECIMAL(10,2))) as total 
       FROM financial_transactions 
       WHERE type = 'income'`
    );

    const [verifyExpense] = await db.query<any[]>(
      `SELECT SUM(CAST(REPLACE(REPLACE(amount, '₱', ''), ',', '') AS DECIMAL(10,2))) as total 
       FROM financial_transactions 
       WHERE type = 'expense'`
    );

    console.log("\n📊 Verification:");
    console.log(`   Total Income: ₱${verifyIncome[0].total?.toLocaleString() || 0}`);
    console.log(`   Total Expenses: ₱${verifyExpense[0].total?.toLocaleString() || 0}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixRemainingCorruptedTransactions();
