import { Router } from "express";
import { getProfile, getUserBookings, updatePassword, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, updatePassword);
router.get("/bookings", requireAuth, getUserBookings);

export default router;
