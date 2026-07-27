import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimit } from "./lib/rate-limit";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Global API rate limit: 1000 requests per 15 minutes per IP
app.use("/api", (req: Request, res: Response, next: NextFunction): void => {
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  if (!rateLimit(`global:${clientIp}`, 1000, 15 * 60 * 1000)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }
  next();
});

app.use("/api", router);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err) {
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
    }, "Unhandled API Error");
  }
  
  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

export default app;
