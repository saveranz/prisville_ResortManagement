-- Check activity tracking data statistics
-- Run this to see how much data is in the user_activity_tracking table

-- Total records
SELECT 'Total Records' as metric, COUNT(*) as count 
FROM user_activity_tracking;

-- Records by time period
SELECT 'Last 7 Days' as metric, COUNT(*) as count 
FROM user_activity_tracking 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 'Last 30 Days' as metric, COUNT(*) as count 
FROM user_activity_tracking 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT 'Last 90 Days' as metric, COUNT(*) as count 
FROM user_activity_tracking 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
UNION ALL
SELECT 'Older than 90 Days' as metric, COUNT(*) as count 
FROM user_activity_tracking 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Date range
SELECT 
  'Date Range' as metric,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  DATEDIFF(MAX(created_at), MIN(created_at)) as days_span
FROM user_activity_tracking;

-- Activity type breakdown
SELECT 
  activity_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_activity_tracking), 2) as percentage
FROM user_activity_tracking
GROUP BY activity_type
ORDER BY count DESC;

-- Recent activity sample (last 10 records)
SELECT 
  id,
  user_id,
  activity_type,
  item_name,
  item_type,
  time_spent,
  created_at
FROM user_activity_tracking
ORDER BY created_at DESC
LIMIT 10;
