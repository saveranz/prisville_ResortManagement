import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { handleDemo } from "./routes/demo";
import { testConnection } from "./db";
import { testDatabase } from "./routes/database";
import { register, login, getCurrentUser, logout } from "./routes/auth";
import { createRoomBooking, getUserRoomBookings, getAllRoomBookings, updateBookingStatus, checkRoomAvailability } from "./routes/bookings";
import { createAmenityBooking, getUserAmenityBookings, getAllAmenityBookings, updateAmenityBookingStatus, checkAmenityAvailability } from "./routes/amenityBookings";
import { createDayPassBooking, getUserDayPassBookings, getAllDayPassBookings, updateDayPassBookingStatus, checkDayPassAvailability } from "./routes/dayPassBookings";
import { setupDatabase } from "./routes/setup";
import { getInventoryItems, addInventoryItem, updateInventoryQuantity, getTransactions, addTransaction } from "./routes/inventory";
import { getUserRecommendations, saveUserPreferences, getUserPreferences } from "./routes/recommendations";
import { trackActivity, getUserActivity, getUserActivityStats } from "./routes/activityTracking";

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
  
  // Session middleware with MySQL store
  app.use(session({
    store: new MySQLStore({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prisville_02',
      clearExpired: false, // Disable to reduce connection usage
      checkExpirationInterval: 0, // Disable automatic cleanup
      expiration: 86400000, // 24 hours in milliseconds
      createDatabaseTable: true, // Auto-create sessions table
      connectionLimit: 1, // Single connection for sessions
      endConnectionOnClose: false,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    }),
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
  
  // Auth routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", getCurrentUser);
  app.post("/api/auth/logout", logout);

  // Booking routes
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
  
  return app;
}
