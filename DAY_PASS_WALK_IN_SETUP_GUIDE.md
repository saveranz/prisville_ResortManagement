# Day Pass Walk-In Setup Guide

## Problem
The day pass walk-in data is being fetched by the API, but the table doesn't exist in your local database, so it returns empty results.

## Solution

Follow these steps to set up your local database:

### Step 1: Run the Safe Setup Script

Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line) and run:

```bash
# If using command line:
mysql -u root -p prisville02 < database/setup_local_database_safe.sql
```

Or copy and paste the contents of `database/setup_local_database_safe.sql` into your MySQL client.

### Step 2: Verify the Setup

Run the verification script to confirm everything is set up correctly:

```bash
# If using command line:
mysql -u root -p prisville02 < database/verify_day_pass_setup.sql
```

Or copy and paste the contents of `database/verify_day_pass_setup.sql` into your MySQL client.

You should see:
- ✅ Table `day_pass_walk_in` exists
- ✅ 24 records inserted
- ✅ Sample data showing names like "Judith", "Francis Bryan L. Aligata", etc.

### Step 3: Restart Your Dev Server

After setting up the database, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
pnpm dev
```

### Step 4: Navigate to the Correct Page

**IMPORTANT:** Make sure you're looking at the right page!

1. Go to the Receptionist Dashboard
2. Click on **"Day Pass"** in the sidebar (NOT "Room Bookings")
3. Click on **"Walk-In"** under Day Pass
4. You should now see the 24 day pass walk-in records

## Common Issues

### Issue 1: "Duplicate column name 'archived'"
This error is OK - it means the `archived` column already exists in your `inventory_items` table. The script will continue and create the other tables.

### Issue 2: "Table already exists"
This is also OK - the script uses `CREATE TABLE IF NOT EXISTS`, so it won't recreate existing tables.

### Issue 3: Still seeing empty table
Make sure you:
1. Ran the setup script successfully
2. Restarted the dev server
3. Are looking at **Day Pass > Walk-In** (not Room Bookings > Walk-In)
4. Check the browser console for any errors

### Issue 4: Data shows in console but not in table
Check the browser console logs:
- Look for `✅ [DAY PASS WALK-IN] Setting X bookings`
- Look for `[Table Render] dayPassWalkInBookings length: X`
- If the first shows 24 but the second shows 0, there's a state update issue

## Verification Checklist

- [ ] Database table `day_pass_walk_in` exists
- [ ] Table has 24 records
- [ ] Dev server is running on port 8081
- [ ] Logged in as receptionist
- [ ] On Day Pass > Walk-In page (not Room Bookings > Walk-In)
- [ ] Browser console shows successful fetch
- [ ] Table displays the 24 records

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check the server console for database errors
3. Run the verification script to confirm data exists
4. Make sure you're on the correct page (Day Pass > Walk-In)
