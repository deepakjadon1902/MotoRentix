import { Router } from "express";
import { getProfile, getUserBookings } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.get("/bookings", requireAuth, getUserBookings);

export default router;
