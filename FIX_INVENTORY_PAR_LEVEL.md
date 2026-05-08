## Fix: PAR Level Not Showing in Inventory

### Problem
When adding a new inventory item, the PAR level is calculated automatically in the form, but doesn't save to the database or show in the data table.

### Root Cause
The `inventory_items` table is missing the `min_stock` column (and possibly other columns like `archived`, `supplier`, `expiry_date`).

### Solution

Run this SQL script to add all missing columns:

```bash
mysql -u root -p prisville02 < database/fix_inventory_table_columns.sql
```

Or copy and paste the contents of `database/fix_inventory_table_columns.sql` into your MySQL client.

### What This Script Does

1. ✅ Adds `min_stock` column (for PAR level)
2. ✅ Adds `archived` column (for soft delete)
3. ✅ Adds `supplier` column (for supplier tracking)
4. ✅ Adds `expiry_date` column (for expiry tracking)
5. ✅ Checks if columns exist first (no errors if already present)
6. ✅ Shows table structure after completion

### After Running the Script

1. **Restart your dev server** (if running)
2. **Try adding a new inventory item**:
   - Enter quantity: **100**
   - PAR level should auto-fill: **80**
3. **Save the item**
4. **Check the data table** - PAR level should now appear!

### Quick Test

After running the script, verify the columns exist:

```sql
DESCRIBE inventory_items;
```

You should see:
- ✅ `min_stock` INT
- ✅ `archived` TINYINT(1)
- ✅ `supplier` VARCHAR(255)
- ✅ `expiry_date` DATE

### Alternative: Simple Version

If you just want to add the `min_stock` column:

```bash
mysql -u root -p prisville02 < database/add_min_stock_simple.sql
```

### How PAR Level Works

1. **Enter Quantity**: Type any number (e.g., 100)
2. **PAR Level Auto-Calculates**: Automatically set to 80% (e.g., 80)
3. **Can Override**: You can manually change the PAR level if needed
4. **Saves to Database**: The `min_stock` value is saved when you submit
5. **Shows in Table**: The PAR level column displays in the inventory table

### Formula
```
PAR Level = Quantity × 0.80 (rounded)
```

### Examples
- Quantity: 100 → PAR Level: 80
- Quantity: 53 → PAR Level: 42
- Quantity: 24 → PAR Level: 20
- Quantity: 15 → PAR Level: 12

---

## Troubleshooting

### Error: "Unknown column 'min_stock'"
**Solution**: Run the fix script above.

### Error: "Duplicate column name 'min_stock'"
**Solution**: The column already exists. Check if the backend is working by adding a test item.

### PAR level still not showing
**Solution**: 
1. Clear browser cache
2. Restart dev server
3. Check browser console for errors
4. Verify the column exists: `DESCRIBE inventory_items;`
