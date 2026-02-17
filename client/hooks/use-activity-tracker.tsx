import { useEffect, useRef, useCallback } from 'react';

interface TrackActivityParams {
  activityType: 'view_room' | 'view_amenity' | 'view_daypass' | 'click_book' | 'search' | 'filter';
  itemType?: string;
  itemName?: string;
  timeSpent?: number;
  additionalData?: any;
}

export function useActivityTracker() {
  const trackActivity = useCallback(async (params: TrackActivityParams) => {
    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params)
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, []);

  return { trackActivity };
}

// Hook to track time spent on a component/page
export function useTimeTracker(
  activityType: TrackActivityParams['activityType'],
  itemType?: string,
  itemName?: string,
  additionalData?: any
) {
  const startTime = useRef<number>(Date.now());
  const { trackActivity } = useActivityTracker();
  const hasTracked = useRef(false);

  useEffect(() => {
    startTime.current = Date.now();
    hasTracked.current = false;

    return () => {
      // Track when component unmounts (user leaves)
      if (!hasTracked.current) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000); // in seconds
        
        // Only track if user spent at least 2 seconds
        if (timeSpent >= 2) {
          trackActivity({
            activityType,
            itemType,
            itemName,
            timeSpent,
            additionalData
          });
        }
        hasTracked.current = true;
      }
    };
  }, [activityType, itemType, itemName, additionalData, trackActivity]);

  return { trackActivity };
}

// Hook to track clicks
export function useClickTracker() {
  const { trackActivity } = useActivityTracker();

  const trackClick = useCallback((
    activityType: TrackActivityParams['activityType'],
    itemType?: string,
    itemName?: string,
    additionalData?: any
  ) => {
    trackActivity({
      activityType,
      itemType,
      itemName,
      timeSpent: 0,
      additionalData
    });
  }, [trackActivity]);

  return { trackClick };
}
