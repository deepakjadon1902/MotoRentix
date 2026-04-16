import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import path from "path";

const app = express();

const frontendUrls = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

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
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.resolve("backend", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/config/google", (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
