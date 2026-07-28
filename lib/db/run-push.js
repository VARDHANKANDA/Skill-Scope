import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Read and validate DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[Push Error] DATABASE_URL environment variable is not set.");
  process.exit(1);
}

try {
  const parsed = new URL(databaseUrl);
  console.log("[Push Info] DATABASE_URL successfully read.");
  console.log(`[Push Info] Host: ${parsed.hostname}`);
  console.log(`[Push Info] Port: ${parsed.port || "default (5432)"}`);
  console.log(`[Push Info] User: ${parsed.username}`);
  console.log(`[Push Info] Database: ${parsed.pathname.substring(1)}`);
  
  const hasSsl = databaseUrl.includes("sslmode=require") || databaseUrl.includes("ssl=true");
  console.log(`[Push Info] SSL Connection detected: ${hasSsl ? "Yes (Render PostgreSQL require mode)" : "No"}`);
} catch (err) {
  console.error("[Push Error] Failed to parse DATABASE_URL. Ensure it is a valid connection URI:", err.message || err);
  process.exit(1);
}

// 2. Execute drizzle-kit push
console.log("[Push Info] Executing drizzle-kit push...");

const extraArgs = process.argv.slice(2);
const args = ["push", "--config", path.join(__dirname, "./drizzle.config.ts"), ...extraArgs];

const child = spawn("drizzle-kit", args, {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
  cwd: __dirname
});

// Automatically accept any confirmation prompts (e.g. "Do you want to push your schema?")
// by writing "y" to the stdin stream.
child.stdin.write("y\n".repeat(10));
child.stdin.end();

child.on("error", (err) => {
  console.error("[Push Error] Failed to start drizzle-kit child process:", err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`[Push Error] drizzle-kit push process exited with non-zero code: ${code} (signal: ${signal})`);
    process.exit(code || 1);
  } else {
    console.log("[Push Info] drizzle-kit push finished successfully.");
  }
});
