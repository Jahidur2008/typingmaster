const { spawn } = require("child_process");
const path = require("path");

console.log("=================================================");
console.log("⌨️  Starting Typing Master Fullstack Dev Services");
console.log("   - Backend API: http://localhost:4000");
console.log("   - Frontend UI: http://localhost:3000");
console.log("=================================================\n");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

// 1. Start Express Backend
const backend = spawn(
  npmCmd,
  ["--prefix", path.join(__dirname, "typing_master", "server"), "run", "dev"],
  { stdio: "inherit", shell: true }
);

// 2. Start Next.js Frontend
const frontend = spawn(
  npmCmd,
  ["--prefix", path.join(__dirname, "typing_master"), "run", "dev"],
  { stdio: "inherit", shell: true }
);

function cleanup() {
  console.log("\n🛑 Stopping all services...");
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
