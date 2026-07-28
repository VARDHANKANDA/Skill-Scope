import { defineConfig } from "drizzle-kit";
import path from "path";

let databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  console.warn("[Config Warning] DATABASE_URL environment variable is missing. Using fallback dummy URL for offline tasks.");
  databaseUrl = "postgresql://postgres:postgres@localhost:5432/dummy";
}

try {
  // Parse DATABASE_URL to verify formatting & credentials
  const url = new URL(databaseUrl);
  console.log("[Config Info] DATABASE_URL read successfully.");
  console.log(`[Config Info] Database Host: ${url.hostname}`);
  console.log(`[Config Info] Database Port: ${url.port || "default (5432)"}`);
  console.log(`[Config Info] Database User: ${url.username}`);
  console.log(`[Config Info] Database Name: ${url.pathname.substring(1)}`);
} catch (err: any) {
  console.error("[Config Error] Exception thrown while reading/validating database config:", err.message || err);
  throw err;
}

// SSL configuration for Render PostgreSQL:
// If sslmode=require or ssl=true is in the connection string, configure SSL rejectUnauthorized: false.
const useSsl = databaseUrl.includes("sslmode=require") || databaseUrl.includes("ssl=true");
console.log(`[Config Info] Render SSL configuration: ${useSsl ? "Enabled (rejectUnauthorized: false)" : "Disabled"}`);

export default defineConfig({
  schema: "./src/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  },
});
