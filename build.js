import { execSync } from "child_process";

console.log("STARTING FULL BUILD...");

// Build the client SPA only — server runs directly via tsx (no server build needed)
execSync("vite build", { stdio: "inherit" });

console.log("BUILD COMPLETE");

// Force exit — vite.config.ts imports server/db.ts which creates a MySQL pool
// that keeps the Node.js event loop alive and prevents the build from exiting.
process.exit(0);
