import { Router } from "express";
import { getProfile, getUserBookings, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/bookings", requireAuth, getUserBookings);

export default router;
