import { execSync } from "child_process";

console.log("STARTING FULL BUILD...");

// Build the client SPA only — server runs directly via tsx (no server build needed)
execSync("vite build", { stdio: "inherit" });

console.log("BUILD COMPLETE");
