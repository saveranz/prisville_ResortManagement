# Notification and Announcement Module - Database Setup

## Quick Setup

Run these commands in order to set up the notification and announcement module:

```bash
# 1. Create the notifications table
mysql -u root -p prisville_02 < database/notifications_table.sql

# 2. Create the announcements table
mysql -u root -p prisville_02 < database/announcements_table.sql

# 3. Create the announcement_views table
mysql -u root -p prisville_02 < database/announcement_views_table.sql

# 4. Load mock data (includes sample notifications and announcements)
mysql -u root -p prisville_02 < database/mock_data.sql
```

## What's Created

### Tables

1. **notifications** - Stores user-specific notifications
   - Booking notifications
   - Event notifications
   - System announcements
   - Payment notifications
   - Status change notifications

2. **announcements** - System-wide announcements
   - Admin-created announcements
   - Targeted to specific audiences
   - Priority-based
   - Scheduled with start/end dates
   - Custom styling (colors, icons)

3. **announcement_views** - Tracks which users viewed which announcements
   - View tracking
   - Analytics support
   - Prevents duplicate view counts

### Sample Data

The mock data includes:
- 9 sample notifications for various users
- 4 sample announcements (general, pool maintenance, special rates, staff meeting)
- View tracking data for some announcements

## Testing the Implementation

### For Client Users

1. Login with a client account:
   - Email: john.doe@gmail.com
   - Password: password123

2. Check the notification bell in the header
   - Should show unread count badge
   - Click to see notification dropdown

3. View the announcement banner
   - Should appear below the header when logged in
   - Auto-rotates if multiple announcements exist

4. Create a booking
   - You'll receive a notification immediately

### For Admin Users

1. Login with admin account:
   - Email: admin@prisville.com
   - Password: admin123

2. Navigate to `/admin/announcements`

3. Create, edit, or delete announcements

4. Toggle announcement active status

5. View announcement statistics

## Verification Queries

Check if everything is set up correctly:

```sql
-- Check if tables exist
SHOW TABLES LIKE '%notification%';
SHOW TABLES LIKE '%announcement%';

-- Count records
SELECT COUNT(*) as notification_count FROM notifications;
SELECT COUNT(*) as announcement_count FROM announcements;
SELECT COUNT(*) as view_count FROM announcement_views;

-- View sample data
SELECT * FROM notifications LIMIT 5;
SELECT * FROM announcements;
```

## Troubleshooting

### Issue: Tables already exist
**Solution:** Drop the tables first if you need to recreate them:
```sql
DROP TABLE IF EXISTS announcement_views;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS notifications;
```

### Issue: Foreign key constraint fails
**Solution:** Ensure the `users` table exists and has the proper structure before creating these tables.

### Issue: Notifications not appearing
**Solution:** 
1. Check if the user is logged in
2. Verify the userId is being passed correctly
3. Check browser console for errors
4. Verify API endpoints are responding

### Issue: Announcements not showing
**Solution:**
1. Ensure announcements have `is_active = TRUE`
2. Check `start_date` is not in the future
3. Check `end_date` has not passed (or is NULL)
4. Verify target_audience matches user role

## API Testing

Test the endpoints with curl:

```bash
# Get notifications (replace USER_ID)
curl -X GET "http://localhost:8080/api/notifications?userId=3&limit=10"

# Get unread count
curl -X GET "http://localhost:8080/api/notifications/unread-count?userId=3"

# Mark as read
curl -X PUT "http://localhost:8080/api/notifications/1/read" \
  -H "Content-Type: application/json" \
  -d '{"userId": 3}'

# Get announcements (replace USER_ID and USER_ROLE)
curl -X GET "http://localhost:8080/api/announcements?userId=3&userRole=client"

# Get all announcements (admin)
curl -X GET "http://localhost:8080/api/announcements/all"
```

## Next Steps

After setup:
1. Review the main documentation: `NOTIFICATION_MODULE_IMPLEMENTATION.md`
2. Test creating bookings to see automatic notifications
3. Test creating announcements from admin panel
4. Customize notification messages in `server/routes/notifications.ts`
5. Customize announcement styling in components

## Support

For issues or questions, refer to:
- Main documentation: `NOTIFICATION_MODULE_IMPLEMENTATION.md`
- Backend routes: `server/routes/notifications.ts` and `server/routes/announcements.ts`
- Frontend components: `client/components/NotificationBell.tsx`, `client/components/AnnouncementBanner.tsx`
