/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Notification types and interfaces
 */
export type NotificationType = 'booking' | 'event' | 'announcement' | 'system' | 'payment' | 'status_change';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type BookingType = 'room' | 'amenity' | 'day_pass';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  related_booking_id?: number;
  related_booking_type?: BookingType;
  priority: NotificationPriority;
  created_at: string;
  read_at?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * Announcement types and interfaces
 */
export type AnnouncementTarget = 'all' | 'clients' | 'staff' | 'specific';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target_audience: AnnouncementTarget;
  target_user_ids?: number[];
  start_date: string;
  end_date?: string;
  is_active: boolean;
  priority: AnnouncementPriority;
  banner_color: string;
  icon: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  views_count: number;
  created_by_name?: string;
  created_by_email?: string;
  is_viewed?: boolean;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
}
