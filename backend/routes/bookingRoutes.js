import { Router } from "express";
import { createBooking, listUserBookings } from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createBooking);
router.get("/user", requireAuth, listUserBookings);

export default router;
