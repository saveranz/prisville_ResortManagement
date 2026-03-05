import db from "../server/db";

async function cleanTransactionDecimals() {
  try {
    console.log("🧹 Cleaning transaction amount decimals...");

    // Get all transactions with .00 in their amounts
    const [transactions] = await db.query<any[]>(
      `SELECT id, description, amount FROM financial_transactions WHERE amount LIKE '%.00'`
    );

    console.log(`📋 Found ${transactions.length} transactions with .00 decimals`);

    if (transactions.length === 0) {
      console.log("✅ No transactions need cleaning!");
      process.exit(0);
    }

    // Update each transaction to remove .00
    for (const transaction of transactions) {
      const cleanAmount = transaction.amount.replace(/\.00$/, '');
      await db.query(
        `UPDATE financial_transactions SET amount = ? WHERE id = ?`,
        [cleanAmount, transaction.id]
      );
      console.log(`  ✓ ${transaction.description}: ${transaction.amount} → ${cleanAmount}`);
    }

    console.log(`\n🎉 Cleaned ${transactions.length} transaction amounts!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanTransactionDecimals();
