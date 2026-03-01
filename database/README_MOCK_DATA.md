# Mock Data Setup Guide

## Overview
The `mock_data.sql` file contains comprehensive test data for the Prisville Resort management system.

## What's Included

### 👥 Users (8 clients)
- **john.doe@gmail.com** - John Doe
- **maria.santos@yahoo.com** - Maria Santos
- **peter.tan@outlook.com** - Peter Tan
- **sarah.cruz@gmail.com** - Sarah Cruz
- **mike.reyes@gmail.com** - Mike Reyes
- **anna.garcia@yahoo.com** - Anna Garcia
- **david.lim@gmail.com** - David Lim (currently checked-in)
- **lisa.martinez@outlook.com** - Lisa Martinez (currently checked-in)

All client passwords: `password123`

### 🏨 Room Bookings (10 total)
- **3 Pending** - Awaiting approval
- **3 Approved** - Ready for check-in (today's date)
- **2 Checked-in** - Currently staying (Rooms 103, 109)
- **2 Completed** - Past stays with checkout records

### 🎉 Amenity Bookings (5 total)
- Swimming Pool party
- Grand Function Hall wedding
- Picnic Area BBQ
- Karaoke Room
- Conference Room (past)

### 🏊 Day Pass Bookings (4 total)
- Mix of pending, approved, and past bookings

### 📦 Inventory (27 items)
Categories:
- Linens & Bedding (6 items)
- Toiletries (4 items)
- Cleaning Supplies (5 items)
- Kitchen & Dining (4 items)
- Pool Supplies (4 items)
- Maintenance (4 items)

### 💰 Financial Transactions (18 total)
- **8 Income** transactions (₱42,100 total)
- **10 Expense** transactions (₱184,700 total)
- Net: -₱142,600 (realistic monthly operations)

### 🚪 Room Status (10 rooms)
- 2 Occupied (103, 109)
- 3 Reserved (102, 106, 108)
- 1 Cleaning (101)
- 3 Available (104, 105, 110)
- 1 Maintenance (107)

### 📜 Stay History (4 records)
- 2 Completed stays with ratings
- 2 Current stays (no checkout yet)

### ⚠️ Booking Issues (4 issues)
- 2 Open/In-progress
- 2 Resolved

## How to Use

### Step 1: Ensure Tables Exist
First, run all table creation scripts in this order:
```bash
# Core tables
1. users_table.sql
2. room_bookings_table.sql
3. amenity_bookings_table.sql
4. day_pass_bookings_table.sql

# Additional features
5. alter_room_bookings_for_checkin.sql
6. room_status_table.sql
7. stay_history_table.sql
8. booking_issues_table.sql
9. inventory_items_table.sql
10. financial_transactions_table.sql
```

### Step 2: Load Mock Data
```bash
mysql -u root -p prisville_db < database/mock_data.sql
```

Or via phpMyAdmin:
1. Select `prisville_db` database
2. Click "Import" tab
3. Choose `mock_data.sql`
4. Click "Go"

### Step 3: Test Login Credentials

**Receptionist Dashboard:**
- URL: `http://localhost:8080/receptionist/login`
- Email: `receptionist@prisville.com`
- Password: `receptionist123`

**Admin Access:**
- Email: `admin@prisville.com`
- Password: `admin123`

**Test Clients:**
- Any client email from the list above
- Password: `password123`

## Testing Scenarios

### 📋 Receptionist Dashboard Features

1. **Overview Tab**
   - Should show 10 total bookings
   - 3 pending approvals
   - 3 approved today
   - Revenue calculations from transactions

2. **Room Bookings Tab**
   - Approve/reject 3 pending bookings
   - View all room bookings with different statuses

3. **Amenity Bookings Tab**
   - Process pending amenity requests
   - See approved and past bookings

4. **Day Pass Tab**
   - Manage day pass bookings

5. **Check-in/Check-out Tab**
   - **Ready for Check-in:** 3 approved bookings for today
   - **Currently Checked-in:** 2 active guests (David Lim, Lisa Martinez)
   - Test check-in flow for approved bookings
   - Test check-out flow for active guests

6. **Room Status Tab**
   - View real-time room availability
   - Update room status (cleaning, maintenance, etc.)
   - See occupied rooms with guest details

7. **Stay History Tab**
   - View past guest records
   - See ratings and staff notes
   - Filter by date/guest

8. **Issues Tab**
   - 2 active issues requiring attention
   - Test issue resolution workflow
   - View resolved issues history

9. **Inventory Tab**
   - 27 items across 6 categories
   - Test adding new items
   - Update quantities
   - View low stock alerts

10. **Transactions Tab**
    - Review income/expense records
    - Calculate profit/loss
    - Add new transactions
    - Generate financial reports

## Data Characteristics

- **Realistic Dates:** Uses current date (2026-03-02) for active bookings
- **Proper Relationships:** All foreign keys correctly linked
- **Various States:** Mix of pending, approved, active, and completed records
- **Real Money Values:** Philippine Peso (₱) amounts
- **Contact Info:** Valid Philippine phone number formats
- **Complete Workflows:** Data supports full check-in → check-out flow

## Cleanup

To remove all mock data and start fresh:
```sql
-- WARNING: This deletes ALL data
DELETE FROM booking_issues;
DELETE FROM stay_history;
DELETE FROM financial_transactions;
DELETE FROM inventory_items;
DELETE FROM day_pass_bookings;
DELETE FROM amenity_bookings;
DELETE FROM room_bookings;
DELETE FROM room_status;
DELETE FROM users WHERE role = 'client';

-- Reset auto-increment
ALTER TABLE booking_issues AUTO_INCREMENT = 1;
ALTER TABLE stay_history AUTO_INCREMENT = 1;
ALTER TABLE financial_transactions AUTO_INCREMENT = 1;
ALTER TABLE inventory_items AUTO_INCREMENT = 1;
ALTER TABLE day_pass_bookings AUTO_INCREMENT = 1;
ALTER TABLE amenity_bookings AUTO_INCREMENT = 1;
ALTER TABLE room_bookings AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 3; -- Keep admin and receptionist
```

## Notes

- All payment proofs use placeholder base64 strings
- Dates are set relative to 2026-03-02 (current demo date)
- Staff users (admin, receptionist) are preserved
- Room status reflects actual booking states
- Financial data shows realistic monthly operations

## Support

For issues or questions about the mock data:
1. Check table relationships in schema files
2. Verify all tables were created before loading data
3. Ensure proper character encoding (utf8mb4)
4. Check MySQL version compatibility (5.7+)
