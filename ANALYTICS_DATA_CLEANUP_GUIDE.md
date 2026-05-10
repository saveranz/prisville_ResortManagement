# Analytics Data Cleanup Guide

## Problem
The analytics dashboard is showing inflated numbers (e.g., 16,672 total events, 6,707 in 7 days) because the `user_activity_tracking` table has accumulated test data over time.

## Solution
I've created tools to diagnose and clean up old activity tracking data while preserving recent, legitimate user activity.

---

## Step 1: Check Current Activity Data

After Railway deploys the latest changes, run this in your browser console:

```javascript
fetch('/api/admin/activity-stats', {
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('=== ACTIVITY DATA STATISTICS ===');
  console.log('Total Records:', data.stats.total);
  console.log('Last 7 Days:', data.stats.last7Days);
  console.log('Last 30 Days:', data.stats.last30Days);
  console.log('Last 90 Days:', data.stats.last90Days);
  console.log('Older than 90 Days:', data.stats.older90Days);
  console.log('Oldest Record:', data.stats.oldestRecord);
  console.log('Newest Record:', data.stats.newestRecord);
  console.log('\nActivity Types:');
  data.stats.activityTypes.forEach(type => {
    console.log(`  ${type.activity_type}: ${type.count}`);
  });
});
```

This will show you:
- How many total activity records exist
- How many are from different time periods
- When the oldest and newest records were created
- Breakdown by activity type

---

## Step 2: Clear Old Activity Data

Based on what you see, choose one of these options:

### Option A: Keep Last 30 Days (Recommended)
This removes all activity data older than 30 days, keeping only recent user engagement:

```javascript
fetch('/api/admin/clear-activity-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ daysToKeep: 30 })
}).then(r => r.json()).then(data => {
  console.log('=== CLEANUP RESULTS ===');
  console.log('Deleted:', data.deletedCount, 'records');
  console.log('Remaining:', data.remainingCount, 'records');
  console.log('Kept last', data.daysKept, 'days');
  alert('Activity data cleaned! Refresh the analytics page.');
});
```

### Option B: Keep Last 90 Days
If you want to preserve more historical data:

```javascript
fetch('/api/admin/clear-activity-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ daysToKeep: 90 })
}).then(r => r.json()).then(data => {
  console.log('=== CLEANUP RESULTS ===');
  console.log('Deleted:', data.deletedCount, 'records');
  console.log('Remaining:', data.remainingCount, 'records');
  console.log('Kept last', data.daysKept, 'days');
  alert('Activity data cleaned! Refresh the analytics page.');
});
```

### Option C: Keep Last 7 Days (Aggressive Cleanup)
If you want to start fresh with only the most recent data:

```javascript
fetch('/api/admin/clear-activity-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ daysToKeep: 7 })
}).then(r => r.json()).then(data => {
  console.log('=== CLEANUP RESULTS ===');
  console.log('Deleted:', data.deletedCount, 'records');
  console.log('Remaining:', data.remainingCount, 'records');
  console.log('Kept last', data.daysKept, 'days');
  alert('Activity data cleaned! Refresh the analytics page.');
});
```

---

## Step 3: Verify Analytics Dashboard

After cleaning the data:

1. **Refresh the Admin Dashboard** - Go to the Analytics tab
2. **Check the numbers** - They should now reflect only recent user activity
3. **Verify the graph** - The "Booking Views Trend" should show realistic patterns

Expected results after cleanup:
- **Total Tracked Events**: Should be much lower (hundreds or low thousands instead of 16,000+)
- **Events (7d/30d/1yr)**: Should match the time period you kept
- **Room/Amenity/Day Pass Views**: Should show actual user engagement
- **Graph**: Should display monthly trends based on real activity

---

## Alternative: SQL Scripts

If you prefer to use Railway's MySQL interface, I've created SQL scripts:

### Check Activity Data
Run `database/CHECK_activity_data.sql` to see:
- Total records
- Records by time period
- Date range
- Activity type breakdown
- Recent activity samples

### Clear Activity Data
Edit and run `database/CLEAR_old_activity_data.sql`:
- Uncomment the option you want (30 days, 90 days, or all)
- Execute the script
- Verify the results

---

## Understanding the Analytics

The analytics dashboard tracks **user activity** for personalized recommendations:

### What Gets Tracked:
- **Page Views**: When users visit different pages
- **Room Views**: When users view room details
- **Amenity Views**: When users view amenity details
- **Day Pass Views**: When users view day pass information
- **Clicks**: User interactions with booking elements
- **Time Spent**: How long users engage with content

### What the Numbers Mean:
- **Total Tracked Events**: All activity records ever recorded
- **Events (7d/30d/1yr)**: Activity within the selected time range
- **Room/Amenity/Day Pass Views**: Specific booking-related views
- **View Time**: Total time users spent viewing booking options
- **Top Viewed Items**: Most popular rooms/amenities/day passes
- **Most Engaged Users**: Users with the most booking-related activity

### Why This Matters:
This data powers the **personalized recommendation system** that suggests rooms, amenities, and day passes based on:
- What users view most often
- How long they spend looking at options
- Which items are trending
- Individual user preferences

---

## Maintenance Recommendations

To prevent data accumulation in the future:

1. **Monthly Cleanup**: Run the cleanup endpoint once a month to remove data older than 90 days
2. **Monitor Growth**: Check activity stats periodically to ensure data isn't growing too fast
3. **Adjust Retention**: If you need longer history for analytics, keep 90+ days; for faster performance, keep 30 days

---

## Troubleshooting

### If numbers still look wrong after cleanup:
1. Clear your browser cache
2. Hard refresh the analytics page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the date range selector (Week/Month/Year)
4. Run the activity stats endpoint again to verify data was cleared

### If the cleanup fails:
1. Check that you're logged in as admin
2. Verify Railway deployment completed successfully
3. Check browser console for error messages
4. Try the SQL scripts as an alternative

---

## Summary

**Current Issue**: Analytics shows inflated numbers due to accumulated test data

**Solution**: Use the new endpoints to check and clear old activity data

**Next Steps**:
1. Wait for Railway deployment to complete
2. Run the activity stats check
3. Clear old data (recommend keeping last 30 days)
4. Refresh analytics dashboard to see realistic numbers

The analytics will now show accurate user engagement data for the personalized recommendation system!
