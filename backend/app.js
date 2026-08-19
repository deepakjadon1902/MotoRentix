import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";
import { rateLimit, securityHeaders } from "./middleware/security.js";
import { logger } from "./utils/logger.js";
import path from "path";
import fs from "fs";
import { legacyUploadsDir, uploadsDir } from "./utils/paths.js";

const app = express();

const frontendUrls = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(requestContext);
app.use(securityHeaders);
app.use(rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "api" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || frontendUrls.length === 0) {
        callback(null, true);
        return;
      }
      if (frontendUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);
app.use(express.json({
  limit: "1mb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
}));
app.use(morgan("dev", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.get("/", (req, res) => {
  res.status(200).json({
    name: "MotoRentix API",
    status: "ok",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
  const queryIndex = req.url.indexOf("?");
  const pathname = queryIndex === -1 ? req.url : req.url.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : req.url.slice(queryIndex);
  const normalizedPathname = pathname.replace(/\/{2,}/g, "/");
  if (normalizedPathname !== pathname) {
    res.redirect(308, `${normalizedPathname}${search}`);
    return;
  }
  next();
});

const primaryUploadsDir = uploadsDir();
const legacyDir = legacyUploadsDir();
app.use("/uploads", express.static(primaryUploadsDir));
if (legacyDir !== primaryUploadsDir && fs.existsSync(legacyDir)) {
  app.use("/uploads", express.static(legacyDir));
}

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/config/google", (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
