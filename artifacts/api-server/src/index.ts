import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";

async function main() {
  logger.info("Starting backend server setup...");
  
  // 1. Run migrations programmatically
  try {
    const migrationsFolder = path.join(__dirname, "../../../lib/db/drizzle");
    logger.info({ migrationsFolder }, "Running database migrations...");
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations completed successfully.");
  } catch (err: any) {
    logger.error({
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      schema: err.schema,
      table: err.table,
      column: err.column,
      constraint: err.constraint,
      stack: err.stack,
    }, "Database migration failed during startup!");
    process.exit(1);
  }

  // 2. Start listening
  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Unhandled error during startup");
  process.exit(1);
});
