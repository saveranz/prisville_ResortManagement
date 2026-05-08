# Day Pass Walk-In Records Not Showing - Fix Guide

## Problem
The day pass walk-in API returns an empty array `"bookings": []`, which means the database table `day_pass_walk_in` is empty or has the wrong structure.

## Root Cause
The database table either:
1. Doesn't have the correct structure (old columns: cottage, cottage_number, amount)
2. Is empty (no records inserted)

## Solution - Run These Steps IN ORDER

### Step 1: Verify Current State
Open your database management tool (phpMyAdmin, MySQL Workbench, etc.) and run:

```sql
-- Check if table exists and its structure
DESCRIBE day_pass_walk_in;

-- Count records
SELECT COUNT(*) FROM day_pass_walk_in;
```

### Step 2: Recreate Table with Correct Structure
Run this file: `database/recreate_day_pass_walk_in_table.sql`

**⚠️ WARNING: This will delete all existing data in the table!**

```sql
-- Drop the existing table
DROP TABLE IF EXISTS day_pass_walk_in;

-- Create with new structure
CREATE TABLE day_pass_walk_in (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  representative_name VARCHAR(255) NOT NULL,
  number_of_pax INT NOT NULL,
  cottage_type ENUM('concrete', 'kubo') NOT NULL,
  time_of_day ENUM('day', 'night') NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: Insert All Historical Data
Run this file: `database/insert_all_day_pass_data_single_query.sql`

This inserts 24 records from April-May 2026 in a single query.

**If you get an error about running it in one go:**
- Some database interfaces don't allow multiple value sets in one INSERT
- In that case, you'll need to run each INSERT separately (see alternative below)

### Step 4: Verify Data Was Inserted
```sql
-- Should return 24
SELECT COUNT(*) FROM day_pass_walk_in;

-- View all records
SELECT 
  id,
  representative_name,
  number_of_pax,
  cottage_type,
  time_of_day,
  total_amount,
  created_at
FROM day_pass_walk_in 
ORDER BY created_at DESC;
```

### Step 5: Refresh Application
1. Refresh your browser (F5 or Ctrl+R)
2. Navigate to Day Pass > Walk-In
3. Check the browser console for logs starting with `🔍 [DAY PASS WALK-IN]`
4. You should see: `✅ [DAY PASS WALK-IN] Setting 24 bookings`

## Alternative: Insert Records One by One

If the single INSERT query doesn't work, run these individually:

```sql
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Judith', 22, 'kubo', 'day', 600.00, '2026-04-02');

INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Francis Bryan L. Aligata', 9, 'kubo', 'day', 400.00, '2026-04-03');

-- ... (continue for all 24 records)
```

## Expected Console Output After Fix

**Frontend:**
```
🔍 [DAY PASS WALK-IN] Starting fetch...
🔍 [DAY PASS WALK-IN] Response status: 200
🔍 [DAY PASS WALK-IN] Bookings count: 24
✅ [DAY PASS WALK-IN] Setting 24 bookings
✅ [DAY PASS WALK-IN] First booking: {
  "id": 1,
  "representative_name": "Judith",
  "number_of_pax": 22,
  "cottage_type": "kubo",
  "time_of_day": "day",
  "total_amount": "600.00"
}
```

**Backend (in server logs):**
```
🔍 [DAY PASS WALK-IN API] Fetching all day pass walk-ins...
✅ [DAY PASS WALK-IN API] Query executed successfully
✅ [DAY PASS WALK-IN API] Fetched bookings count: 24
```

## Troubleshooting

### If you still see 0 records after inserting:
1. Check you're connected to the correct database
2. Verify the INSERT queries executed without errors
3. Run: `SELECT * FROM day_pass_walk_in;` to see if data exists
4. Check server logs for backend errors

### If you see database errors:
- Make sure your database user has CREATE and DROP permissions
- Check that the database connection is working
- Verify the database name in your `.env` file

## Files Involved
- `database/recreate_day_pass_walk_in_table.sql` - Recreates table
- `database/insert_all_day_pass_data_single_query.sql` - Inserts all data
- `database/verify_day_pass_walk_in.sql` - Verification queries
- `server/routes/dayPassWalkIn.ts` - Backend API
- `client/pages/ReceptionistDashboard.tsx` - Frontend display
