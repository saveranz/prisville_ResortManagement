# Linen Inventory Setup Guide

## Problem
You want to insert consolidated linen inventory (4 items total, no duplicates) with automatic PAR levels.

## Solution - Choose Your Method

### Method 1: Safe SQL Script (Recommended)
**File**: `database/insert_consolidated_linens_safe.sql`

This script automatically checks if the `min_stock` column exists before adding it.

```bash
mysql -u root -p prisville02 < database/insert_consolidated_linens_safe.sql
```

**Pros**: 
- ✅ Handles the min_stock column automatically
- ✅ No errors even if column exists or doesn't exist
- ✅ Most reliable

---

### Method 2: Simple SQL Script
**File**: `database/insert_consolidated_linens_simple.sql`

Use this if you already have the `min_stock` column OR if you want to add it manually first.

**Step 1**: Add min_stock column (skip if you already have it)
```sql
ALTER TABLE inventory_items ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity;
```

**Step 2**: Run the script
```bash
mysql -u root -p prisville02 < database/insert_consolidated_linens_simple.sql
```

**Pros**:
- ✅ Simpler, cleaner script
- ✅ No complex SQL logic

---

### Method 3: API Endpoint
**Endpoint**: `POST /api/admin/insert-linen-inventory`

The API automatically handles the min_stock column.

**Option A**: Use the test page
1. Open `test-insert-linen-inventory.html` in your browser
2. Click "Insert Consolidated Inventory"

**Option B**: Use browser console
```javascript
fetch('http://localhost:8081/api/admin/insert-linen-inventory', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(data => console.log('✅ Result:', data));
```

**Pros**:
- ✅ Handles everything automatically
- ✅ Shows nice summary
- ✅ No SQL knowledge needed

---

## What Gets Inserted

| Item | Quantity | PAR Level | Unit Price | Total Value |
|------|----------|-----------|------------|-------------|
| Towel | 24 pcs | 20 pcs | ₱50.00 | ₱1,200.00 |
| Pillow | 53 pcs | 42 pcs | ₱100.00 | ₱5,300.00 |
| Kumot | 15 pcs | 12 pcs | ₱150.00 | ₱2,250.00 |
| Bedsheet | 22 pcs | 18 pcs | ₱120.00 | ₱2,640.00 |
| **TOTAL** | **114 pcs** | - | - | **₱11,390.00** |

### PAR Level Calculation
- **Formula**: Total Quantity × 0.80 (rounded)
- **Purpose**: Low stock alert when inventory ≤ PAR level
- **Example**: Towel PAR = 24 × 0.80 = 19.2 → rounded to 20

---

## Troubleshooting

### Error: "Duplicate column name 'min_stock'"
**Solution**: The column already exists. Use Method 2 (Simple SQL Script) instead.

### Error: "Unknown column 'min_stock'"
**Solution**: The column doesn't exist. Use Method 1 (Safe SQL Script) or add the column manually:
```sql
ALTER TABLE inventory_items ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity;
```

### Error: "Access denied"
**Solution**: Make sure you're logged in as admin or receptionist.

### Still seeing duplicates?
**Solution**: The script deletes old records first. If you still see duplicates, run:
```sql
DELETE FROM inventory_items WHERE category = 'Linens';
```
Then run the insert script again.

---

## Verification

After inserting, verify the data:

```sql
SELECT 
  item_name,
  quantity,
  min_stock,
  CONCAT('₱', unit_price) as price
FROM inventory_items 
WHERE category = 'Linens';
```

Expected result: **4 rows** (Towel, Pillow, Kumot, Bedsheet)

---

## Quick Start (TL;DR)

**Easiest way**:
1. Open `test-insert-linen-inventory.html`
2. Click "Insert Consolidated Inventory"
3. Done! ✅

**SQL way**:
```bash
mysql -u root -p prisville02 < database/insert_consolidated_linens_safe.sql
```
