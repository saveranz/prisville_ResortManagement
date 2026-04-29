import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { handleDemo } from "./routes/demo";
import pool, { testConnection } from "./db";
import { testDatabase } from "./routes/database";
import { register, login, getCurrentUser, logout, requestPasswordReset, verifyResetToken, resetPassword, verifyEmail, resendVerification } from "./routes/auth";
import { createRoomBooking, getUserRoomBookings, getAllRoomBookings, updateBookingStatus, checkRoomAvailability, getUnavailableDates } from "./routes/bookings";
import { createAmenityBooking, getUserAmenityBookings, getAllAmenityBookings, updateAmenityBookingStatus, checkAmenityAvailability } from "./routes/amenityBookings";
import { createDayPassBooking, getUserDayPassBookings, getAllDayPassBookings, updateDayPassBookingStatus, checkDayPassAvailability } from "./routes/dayPassBookings";
import { setupDatabase, migrateRoomType, migrateUserStatus, setupFAQs, setupAllMissingTables } from "./routes/setup";
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryQuantity, receiveStock, issueStock, getInventoryTransactions, getInventoryStats, getTransactions, addTransaction } from "./routes/inventory";
import { getUserRecommendations, saveUserPreferences, getUserPreferences } from "./routes/recommendations";
import { trackActivity, getUserActivity, getUserActivityStats } from "./routes/activityTracking";
import { getAllRoomStatus, updateRoomStatus, markRoomCleaned, getRoomStatusByNumbers } from "./routes/roomStatus";
import { checkInGuest, checkOutGuest, getCurrentlyCheckedIn, getAvailableRoomsForCheckIn } from "./routes/checkInOut";
import { getUserStayHistory, getAllStayHistory, getGuestStatistics, updateStayHistory } from "./routes/stayHistory";
import { createBookingIssue, getAllBookingIssues, getUserBookingIssues, getBookingIssueById, updateBookingIssueStatus, updateBookingIssuePriority, deleteBookingIssue } from "./routes/bookingIssues";
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification } from "./routes/notifications";
import { getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementViewed, toggleAnnouncementStatus } from "./routes/announcements";
import { getDashboardStats, getAllUsers, updateUserRole, getGuestActivity, getRoomOccupancy, getBookingIssues, getUserActivityAnalytics, lockUser, unlockUser, deleteUser, uploadGcashQr } from "./routes/admin";
import { generateBookingReport, generateRevenueReport, generateOccupancyReport, generateGuestReport } from "./routes/reports";
import { getAllRooms, getAllAmenities, getDayPassStats, getRoomAvailabilityCalendar, createRoom, updateRoom, deleteRoom, getRoomExtraItems, addRoomExtraItem, updateRoomExtraItem, deleteRoomExtraItem } from "./routes/facilities";
import { getAllSettings, updateSetting, updateMultipleSettings, resetSettings } from "./routes/siteSettings";
import { getPaymentSettings, updatePaymentSettings } from "./routes/paymentSettings";
import { getAllFAQs, getAdminFAQs, createFAQ, updateFAQ, deleteFAQ, submitInquiry, getAllInquiries, getInquiryStats, updateInquiryStatus, respondToInquiry } from "./routes/faq";
import { migrateAuditLogs, getAuditLogs } from "./routes/auditLog";
import { requireAuth, requireAdmin, requireStaff, requireReceptionist } from "./middleware/auth";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Temporary upload directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const MySQLStore = MySQLStoreFactory(session);

export function createServer() {
  const app = express();

  // Trust Railway/cloud proxy so secure cookies work behind HTTPS termination
  app.set('trust proxy', 1);

  // Middleware
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'https://prisville.com',
    'https://www.prisville.com',
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Session middleware with MySQL store (using existing pool)
  const sessionStore = new MySQLStore({
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
  }, pool);

  // Surface store errors as warnings — do not crash the process
  sessionStore.on('error', (err: Error) => {
    console.error('[session-store] MySQL session store error:', err.message);
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'prisville-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'prisville.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
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

  // Email config diagnostic (no secrets exposed)
  app.get("/api/test-email-config", async (_req, res) => {
    const { testEmailConnection } = await import("./utils/emailService");
    const hasKey = !!process.env.RESEND_API_KEY;
    const appUrl = process.env.APP_URL || 'NOT SET';
    const frontendUrl = process.env.FRONTEND_URL || 'NOT SET';
    const emailFrom = process.env.EMAIL_FROM || 'NOT SET (default: onboarding@resend.dev)';
    
    let connected = false;
    let connError = '';
    try {
      connected = await testEmailConnection();
    } catch (err: any) {
      connError = err.message || String(err);
    }

    res.json({
      RESEND_API_KEY_SET: hasKey,
      EMAIL_FROM: emailFrom,
      APP_URL: appUrl,
      FRONTEND_URL: frontendUrl,
      RESEND_CONNECTION: connected ? 'OK' : 'FAILED',
      ERROR: connError || undefined,
    });
  });

  // Debug: check if email is in users vs pending_users
  app.get("/api/debug/check-user/:email", async (req, res) => {
    const { email } = req.params;
    const [users] = await pool.query<any[]>('SELECT id, email, name, role, email_verified, created_at FROM users WHERE email = ?', [email]);
    const [pending] = await pool.query<any[]>('SELECT id, email, name, created_at FROM pending_users WHERE email = ?', [email]);
    res.json({
      in_users_table: users.length > 0,
      user: users[0] || null,
      in_pending_table: pending.length > 0,
      pending: pending[0] || null,
    });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/test-db", testDatabase);
  app.get("/api/setup-db", setupDatabase);
  app.get("/api/setup-faqs", setupFAQs);
  app.get("/api/setup-all", setupAllMissingTables);
  app.get("/api/migrate-room-type", migrateRoomType);
  app.get("/api/migrate-user-status", migrateUserStatus);
  app.get("/api/migrate-audit-logs", migrateAuditLogs);
  app.get("/api/admin/audit-logs", requireAdmin, getAuditLogs);

  // TEMPORARY: Full DB reset (remove after use)
  app.get("/api/reset-db-prisville2026", async (_req, res) => {
    try {
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
      const tables = [
        "pending_users", "sessions", "user_activity_tracking", "user_preferences",
        "notifications", "room_bookings", "amenity_bookings", "day_pass_bookings",
        "day_pass_guests", "financial_transactions", "stay_history", "booking_issues",
        "admin_audit_logs", "announcement_views"
      ];
      for (const table of tables) {
        try { await pool.query(`TRUNCATE TABLE \`${table}\``); } catch {}
      }
      await pool.query("DELETE FROM users WHERE role = 'client'");
      await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      res.json({ success: true, message: "Database reset complete. All client users and data cleared. Admin and receptionist kept." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Auth routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", getCurrentUser);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/request-password-reset", requestPasswordReset);
  app.post("/api/auth/verify-reset-token", verifyResetToken);
  app.post("/api/auth/reset-password", resetPassword);
  app.post("/api/auth/verify-email", verifyEmail);
  app.post("/api/auth/resend-verification", resendVerification);

  // Booking routes
  app.get("/api/bookings/room/unavailable-dates", getUnavailableDates);
  app.get("/api/bookings/room/check-availability", checkRoomAvailability);
  app.post("/api/bookings/room", createRoomBooking);
  app.get("/api/bookings/room", getUserRoomBookings);
  app.get("/api/bookings/room/all", requireStaff, getAllRoomBookings);
  app.put("/api/bookings/room/status", requireStaff, updateBookingStatus);

  // Amenity Booking routes
  app.get("/api/bookings/amenity/check-availability", checkAmenityAvailability);
  app.post("/api/bookings/amenity", createAmenityBooking);
  app.get("/api/bookings/amenity", getUserAmenityBookings);
  app.get("/api/bookings/amenity/all", requireStaff, getAllAmenityBookings);
  app.put("/api/bookings/amenity/status", requireStaff, updateAmenityBookingStatus);

  // Day Pass Booking routes
  app.get("/api/bookings/day-pass/check-availability", checkDayPassAvailability);
  app.post("/api/bookings/day-pass", createDayPassBooking);
  app.get("/api/bookings/day-pass", getUserDayPassBookings);
  app.get("/api/bookings/day-pass/all", requireStaff, getAllDayPassBookings);
  app.put("/api/bookings/day-pass/status", requireStaff, updateDayPassBookingStatus);

  // Inventory routes - Require receptionist/admin authorization
  app.get("/api/inventory", requireStaff, getInventoryItems);
  app.get("/api/inventory/stats", requireStaff, getInventoryStats);
  app.post("/api/inventory", requireStaff, addInventoryItem);
  app.put("/api/inventory/update", requireStaff, updateInventoryItem);
  app.delete("/api/inventory", requireStaff, deleteInventoryItem);
  app.put("/api/inventory/update-quantity", requireStaff, updateInventoryQuantity);
  app.post("/api/inventory/receive", requireStaff, receiveStock);
  app.post("/api/inventory/issue", requireStaff, issueStock);
  app.get("/api/inventory/stock-transactions", requireStaff, getInventoryTransactions);
  app.get("/api/inventory/transactions", requireStaff, getTransactions);
  app.post("/api/inventory/transactions", requireStaff, addTransaction);
  
  // Recommendation routes
  app.get("/api/recommendations", getUserRecommendations);
  app.post("/api/preferences", saveUserPreferences);
  app.get("/api/preferences", getUserPreferences);
  
  // Activity tracking routes
  app.post("/api/activity/track", trackActivity);
  app.get("/api/activity/history", getUserActivity);
  app.get("/api/activity/stats", getUserActivityStats);
  
  // Room Status routes - Require receptionist/admin authorization
  app.get("/api/room-status", requireReceptionist, getAllRoomStatus);
  app.put("/api/room-status", requireReceptionist, updateRoomStatus);
  app.put("/api/room-status/cleaned", requireReceptionist, markRoomCleaned);
  app.get("/api/room-status/by-number", requireReceptionist, getRoomStatusByNumbers);
  
  // Check-in/Check-out routes - Require receptionist/admin authorization
  app.post("/api/checkin", requireReceptionist, checkInGuest);
  app.post("/api/checkout", requireReceptionist, checkOutGuest);
  app.get("/api/checkin/current", requireReceptionist, getCurrentlyCheckedIn);
  app.get("/api/checkin/available-rooms", requireReceptionist, getAvailableRoomsForCheckIn);
  
  // Stay History routes - Require staff authorization for management, regular users can view their own
  app.get("/api/stay-history/user", getUserStayHistory);
  app.get("/api/stay-history/all", requireStaff, getAllStayHistory);
  app.get("/api/stay-history/statistics", requireStaff, getGuestStatistics);
  app.put("/api/stay-history", requireStaff, updateStayHistory);
  
  // Booking Issues routes
  app.post("/api/booking-issues", createBookingIssue);
  app.get("/api/booking-issues", requireStaff, getAllBookingIssues);
  app.get("/api/booking-issues/user", getUserBookingIssues);
  app.get("/api/booking-issues/:id", getBookingIssueById);
  app.put("/api/booking-issues/status", requireStaff, updateBookingIssueStatus);
  app.put("/api/booking-issues/priority", requireStaff, updateBookingIssuePriority);
  app.delete("/api/booking-issues/:id", requireStaff, deleteBookingIssue);
  
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
  app.post("/api/announcements", requireAdmin, createAnnouncement);
  app.put("/api/announcements/:announcementId", requireAdmin, updateAnnouncement);
  app.delete("/api/announcements/:announcementId", requireAdmin, deleteAnnouncement);
  app.post("/api/announcements/:announcementId/view", markAnnouncementViewed);
  app.put("/api/announcements/:announcementId/toggle-status", requireAdmin, toggleAnnouncementStatus);
  
  // Admin routes - All require admin authorization
  app.get("/api/admin/dashboard/stats", requireAdmin, getDashboardStats);
  app.get("/api/admin/users", requireAdmin, getAllUsers);
  app.put("/api/admin/users/:userId/role", requireAdmin, updateUserRole);
  app.put("/api/admin/users/:userId/lock", requireAdmin, lockUser);
  app.put("/api/admin/users/:userId/unlock", requireAdmin, unlockUser);
  app.delete("/api/admin/users/:userId", requireAdmin, deleteUser);
  app.get("/api/admin/guest-activity", requireAdmin, getGuestActivity);
  app.get("/api/admin/room-occupancy", requireAdmin, getRoomOccupancy);
  app.get("/api/admin/booking-issues", requireAdmin, getBookingIssues);
  app.get("/api/admin/activity-analytics", requireAdmin, getUserActivityAnalytics);
  app.post("/api/admin/upload-gcash-qr", requireAdmin, upload.single('gcashQr'), uploadGcashQr);
  
  // Reports routes - Require admin authorization
  app.get("/api/reports/bookings", requireAdmin, generateBookingReport);
  app.get("/api/reports/revenue", requireAdmin, generateRevenueReport);
  app.get("/api/reports/occupancy", requireAdmin, generateOccupancyReport);
  app.get("/api/reports/guests", requireAdmin, generateGuestReport);
  
  // Facilities routes
  app.get("/api/facilities/rooms", getAllRooms);
  app.post("/api/facilities/rooms", requireAdmin, createRoom);
  app.put("/api/facilities/rooms/:roomId", requireAdmin, updateRoom);
  app.delete("/api/facilities/rooms/:roomId", requireAdmin, deleteRoom);
  app.get("/api/facilities/amenities", getAllAmenities);
  app.get("/api/facilities/daypass-stats", getDayPassStats);
  app.get("/api/facilities/room-calendar", getRoomAvailabilityCalendar);
  
    // Extra items routes
    app.get("/api/facilities/rooms/:roomId/extra-items", getRoomExtraItems);
    app.post("/api/facilities/rooms/:roomId/extra-items", requireAdmin, addRoomExtraItem);
    app.put("/api/facilities/rooms/:roomId/extra-items/:itemId", requireAdmin, updateRoomExtraItem);
    app.delete("/api/facilities/rooms/:roomId/extra-items/:itemId", requireAdmin, deleteRoomExtraItem);
  
  // Site Settings routes - Admin only
  app.get("/api/site-settings", getAllSettings);
  app.put("/api/site-settings/:settingKey", requireAdmin, updateSetting);
  app.put("/api/site-settings", requireAdmin, updateMultipleSettings);
  app.post("/api/site-settings/reset", requireAdmin, resetSettings);

  // Payment Settings routes
  app.get("/api/payment-settings", getPaymentSettings);
  app.put("/api/payment-settings", requireAdmin, updatePaymentSettings);
  
  // FAQ routes
  app.get("/api/faqs", getAllFAQs); // Public
  app.get("/api/admin/faqs", requireAdmin, getAdminFAQs);
  app.post("/api/admin/faqs", requireAdmin, createFAQ);
  app.put("/api/admin/faqs/:faqId", requireAdmin, updateFAQ);
  app.delete("/api/admin/faqs/:faqId", requireAdmin, deleteFAQ);
  
  // Inquiry routes
  app.post("/api/inquiries", submitInquiry); // Public
  app.get("/api/admin/inquiries", requireStaff, getAllInquiries);
  app.get("/api/admin/inquiries/stats", requireStaff, getInquiryStats);
  app.put("/api/admin/inquiries/:inquiryId/status", requireStaff, updateInquiryStatus);
  app.post("/api/admin/inquiries/:inquiryId/respond", requireStaff, respondToInquiry);
  
  // Global JSON error handler — must be last, returns JSON instead of Express 5's default HTML
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[error]", err?.message || err);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({
      error: err?.message || "Internal server error",
    });
  });

  return app;
}
