import db from "../server/db";

async function inspectTransactions() {
  try {
    console.log("🔍 Inspecting transaction amounts...\n");

    // Get all transactions
    const [transactions] = await db.query<any[]>(
      `SELECT id, type, description, amount, CHAR_LENGTH(amount) as length, HEX(amount) as hex_value 
       FROM financial_transactions 
       ORDER BY id`
    );

    console.log(`Total transactions: ${transactions.length}\n`);

    // Check for income transactions
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    console.log(`Income transactions: ${incomeTransactions.length}`);
    console.log(`Expense transactions: ${expenseTransactions.length}\n`);

    // Show sample income transactions
    console.log("📊 Sample INCOME transactions:");
    incomeTransactions.slice(0, 5).forEach(t => {
      console.log(`   ID ${t.id}: ${t.amount} | Length: ${t.length} | ${t.description}`);
    });

    console.log("\n📊 Sample EXPENSE transactions:");
    expenseTransactions.slice(0, 5).forEach(t => {
      console.log(`   ID ${t.id}: ${t.amount} | Length: ${t.length} | ${t.description}`);
    });

    // Check for problematic amounts
    console.log("\n⚠️  Checking for problematic amounts...");
    const problematic = transactions.filter(t => {
      const cleanAmount = t.amount.replace(/[₱,]/g, '');
      const parsed = parseFloat(cleanAmount);
      return isNaN(parsed) || t.length > 15;
    });

    if (problematic.length > 0) {
      console.log(`\nFound ${problematic.length} problematic transactions:`);
      problematic.forEach(t => {
        console.log(`   ID ${t.id} [${t.type}]: "${t.amount}" (length: ${t.length})`);
        console.log(`      HEX: ${t.hex_value}`);
        console.log(`      Description: ${t.description}`);
      });
    } else {
      console.log("✅ All amounts look good!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

inspectTransactions();
