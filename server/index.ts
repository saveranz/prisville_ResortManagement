import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { handleDemo } from "./routes/demo";
import pool, { testConnection } from "./db";
import { testDatabase } from "./routes/database";
import { register, login, getCurrentUser, logout } from "./routes/auth";
import { createRoomBooking, getUserRoomBookings, getAllRoomBookings, updateBookingStatus, checkRoomAvailability, getUnavailableDates } from "./routes/bookings";
import { createAmenityBooking, getUserAmenityBookings, getAllAmenityBookings, updateAmenityBookingStatus, checkAmenityAvailability } from "./routes/amenityBookings";
import { createDayPassBooking, getUserDayPassBookings, getAllDayPassBookings, updateDayPassBookingStatus, checkDayPassAvailability } from "./routes/dayPassBookings";
import { setupDatabase, migrateRoomType } from "./routes/setup";
import { getInventoryItems, addInventoryItem, updateInventoryQuantity, getTransactions, addTransaction } from "./routes/inventory";
import { getUserRecommendations, saveUserPreferences, getUserPreferences } from "./routes/recommendations";
import { trackActivity, getUserActivity, getUserActivityStats } from "./routes/activityTracking";
import { getAllRoomStatus, updateRoomStatus, markRoomCleaned, getRoomStatusByNumbers } from "./routes/roomStatus";
import { checkInGuest, checkOutGuest, getCurrentlyCheckedIn } from "./routes/checkInOut";
import { getUserStayHistory, getAllStayHistory, getGuestStatistics, updateStayHistory } from "./routes/stayHistory";
import { createBookingIssue, getAllBookingIssues, getUserBookingIssues, getBookingIssueById, updateBookingIssueStatus, updateBookingIssuePriority, deleteBookingIssue } from "./routes/bookingIssues";
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification } from "./routes/notifications";
import { getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementViewed, toggleAnnouncementStatus } from "./routes/announcements";

const MySQLStore = MySQLStoreFactory(session);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Session middleware with MySQL store (using existing pool)
  app.use(session({
    store: new MySQLStore({
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 minutes
      expiration: 86400000, // 24 hours in milliseconds
      createDatabaseTable: true, // Auto-create table if it doesn't exist
      endConnectionOnClose: false,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    }, pool),
    secret: process.env.SESSION_SECRET || 'prisville-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'prisville.sid',
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    }
  }));

  // Test database connection on startup
  testConnection();

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/test-db", testDatabase);
  app.get("/api/setup-db", setupDatabase);
  app.get("/api/migrate-room-type", migrateRoomType);
  
  // Auth routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", getCurrentUser);
  app.post("/api/auth/logout", logout);

  // Booking routes
  app.get("/api/bookings/room/unavailable-dates", getUnavailableDates);
  app.get("/api/bookings/room/check-availability", checkRoomAvailability);
  app.post("/api/bookings/room", createRoomBooking);
  app.get("/api/bookings/room", getUserRoomBookings);
  app.get("/api/bookings/room/all", getAllRoomBookings);
  app.put("/api/bookings/room/status", updateBookingStatus);

  // Amenity Booking routes
  app.get("/api/bookings/amenity/check-availability", checkAmenityAvailability);
  app.post("/api/bookings/amenity", createAmenityBooking);
  app.get("/api/bookings/amenity", getUserAmenityBookings);
  app.get("/api/bookings/amenity/all", getAllAmenityBookings);
  app.put("/api/bookings/amenity/status", updateAmenityBookingStatus);

  // Day Pass Booking routes
  app.get("/api/bookings/day-pass/check-availability", checkDayPassAvailability);
  app.post("/api/bookings/day-pass", createDayPassBooking);
  app.get("/api/bookings/day-pass", getUserDayPassBookings);
  app.get("/api/bookings/day-pass/all", getAllDayPassBookings);
  app.put("/api/bookings/day-pass/status", updateDayPassBookingStatus);

  // Inventory routes
  app.get("/api/inventory", getInventoryItems);
  app.post("/api/inventory", addInventoryItem);
  app.put("/api/inventory/update-quantity", updateInventoryQuantity);
  app.get("/api/inventory/transactions", getTransactions);
  app.post("/api/inventory/transactions", addTransaction);
  
  // Recommendation routes
  app.get("/api/recommendations", getUserRecommendations);
  app.post("/api/preferences", saveUserPreferences);
  app.get("/api/preferences", getUserPreferences);
  
  // Activity tracking routes
  app.post("/api/activity/track", trackActivity);
  app.get("/api/activity/history", getUserActivity);
  app.get("/api/activity/stats", getUserActivityStats);
  
  // Room Status routes
  app.get("/api/room-status", getAllRoomStatus);
  app.put("/api/room-status", updateRoomStatus);
  app.put("/api/room-status/cleaned", markRoomCleaned);
  app.get("/api/room-status/by-number", getRoomStatusByNumbers);
  
  // Check-in/Check-out routes
  app.post("/api/checkin", checkInGuest);
  app.post("/api/checkout", checkOutGuest);
  app.get("/api/checkin/current", getCurrentlyCheckedIn);
  
  // Stay History routes
  app.get("/api/stay-history/user", getUserStayHistory);
  app.get("/api/stay-history/all", getAllStayHistory);
  app.get("/api/stay-history/statistics", getGuestStatistics);
  app.put("/api/stay-history", updateStayHistory);
  
  // Booking Issues routes
  app.post("/api/booking-issues", createBookingIssue);
  app.get("/api/booking-issues", getAllBookingIssues);
  app.get("/api/booking-issues/user", getUserBookingIssues);
  app.get("/api/booking-issues/:id", getBookingIssueById);
  app.put("/api/booking-issues/status", updateBookingIssueStatus);
  app.put("/api/booking-issues/priority", updateBookingIssuePriority);
  app.delete("/api/booking-issues/:id", deleteBookingIssue);
  
  // Notification routes
  app.get("/api/notifications", getUserNotifications);
  app.get("/api/notifications/unread-count", getUnreadCount);
  app.put("/api/notifications/:notificationId/read", markAsRead);
  app.put("/api/notifications/read-all", markAllAsRead);
  app.post("/api/notifications", createNotification);
  app.delete("/api/notifications/:notificationId", deleteNotification);
  
  // Announcement routes
  app.get("/api/announcements", getAnnouncements);
  app.get("/api/announcements/all", getAllAnnouncements);
  app.post("/api/announcements", createAnnouncement);
  app.put("/api/announcements/:announcementId", updateAnnouncement);
  app.delete("/api/announcements/:announcementId", deleteAnnouncement);
  app.post("/api/announcements/:announcementId/view", markAnnouncementViewed);
  app.put("/api/announcements/:announcementId/toggle-status", toggleAnnouncementStatus);
  
  return app;
}
