import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDb from "./src/config/db.js";
import healthRoutes from "./src/routes/health.js";
import vehicleRoutes from "./src/routes/vehicles.js";
import bookingRoutes from "./src/routes/bookings.js";
import adminRoutes from "./src/routes/admin.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
import seedAdmin from "./src/utils/seedAdmin.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDb();
  await seedAdmin();
  app.listen(port, () => {
    console.log(`MotoRentix API listening on port ${port}`);
  });
};

start();
