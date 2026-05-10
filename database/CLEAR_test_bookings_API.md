# Clear Test Bookings via API

Since Railway MySQL interface has issues, you can clear the test bookings using SQL commands through an API endpoint.

## Option 1: Run SQL directly in Railway MySQL

1. Go to Railway Dashboard
2. Open your MySQL database
3. Click on "Query" tab
4. Copy and paste this SQL:

```sql
-- Clear room bookings (test data)
DELETE FROM room_bookings WHERE id IN (1, 2, 3, 4);

-- Clear day pass bookings (test data)
DELETE FROM day_pass_bookings WHERE id IN (1, 2);

-- Verify
SELECT 'Room Bookings' as table_name, COUNT(*) as count FROM room_bookings
UNION ALL
SELECT 'Day Pass Bookings' as table_name, COUNT(*) as count FROM day_pass_bookings;
```

## Option 2: Create a temporary API endpoint

I can create a temporary API endpoint that you can call once to clear the data, then remove it.

Would you like me to create this endpoint?

## Option 3: Clear specific bookings by ID

If you want to be more selective, you can delete specific booking IDs:

### Room Bookings to Delete:
- ID #1: Angelica B. Bejer - Family Fan Room - Apr 5, 2026
- ID #2: Bow Astrid - Family Fan Room - Apr 5, 2026  
- ID #3: Angelica B. Bejer - Family Fan Room - Apr 13, 2026
- ID #4: Erwin Dwight Nava - Standard Room (Aircon) - Apr 25, 2026

### Day Pass Bookings to Delete:
- ID #1: angelicabejer07@gmail.com - Apr 14, 2026 - 10 guests
- ID #2: angelicabejer07@gmail.com - May 10, 2026 - 8 guests

## Safety Note

This will permanently delete these bookings. Make sure you want to remove them before running the SQL commands.
