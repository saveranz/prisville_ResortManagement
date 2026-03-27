import { execSync } from "child_process";

console.log("STARTING FULL BUILD...");

execSync("vite build", { stdio: "inherit" });
execSync("vite build --config vite.config.server.ts", { stdio: "inherit" });

console.log("BUILD COMPLETE");
