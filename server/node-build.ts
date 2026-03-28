console.log("SERVER STARTING...");
import path from "path";
import express from "express";
import { createServer } from "./index";

const app = createServer();

const PORT = Number(process.env.PORT) || 3000;
// Use cwd so this works whether run from compiled dist/server/ or directly from source
const distPath = path.join(process.cwd(), "dist/spa");

// Serve static files AFTER API routes (which are already registered in createServer)
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("/*path", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[startup] Server listening on 0.0.0.0:${PORT}`);
  console.log("[startup] Node environment:", process.env.NODE_ENV || "development");
  console.log("[startup] API ready at /api");
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error("[startup] Server failed to start:", error.message);
  if (error.code) {
    console.error("[startup] Error code:", error.code);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[shutdown] Received SIGTERM, closing server...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[shutdown] Received SIGINT, closing server...");
  server.close(() => process.exit(0));
});

process.on("uncaughtException", (error) => {
  console.error("[fatal] Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[fatal] Unhandled rejection:", reason);
  process.exit(1);
});
