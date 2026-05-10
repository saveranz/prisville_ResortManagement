-- Clear old activity tracking data
-- This will remove test data and keep only recent activity

-- OPTION 1: Keep only last 30 days (recommended for production)
-- Uncomment to use:
-- DELETE FROM user_activity_tracking 
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- OPTION 2: Keep only last 90 days
-- Uncomment to use:
-- DELETE FROM user_activity_tracking 
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- OPTION 3: Clear ALL activity data (use with caution!)
-- Uncomment to use:
-- DELETE FROM user_activity_tracking;

-- After clearing, check the remaining count:
SELECT 'Remaining Records' as metric, COUNT(*) as count 
FROM user_activity_tracking;

-- Verify date range after clearing:
SELECT 
  'Date Range After Clear' as metric,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  DATEDIFF(MAX(created_at), MIN(created_at)) as days_span
FROM user_activity_tracking;
