import { Router } from "express";
import {
  adminLogin,
  adminGoogleLogin,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  listUsers,
  updateUserStatus,
  listBookings,
  analytics,
  listMessages,
  replyMessage,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

router.post("/login", adminLogin);
router.post("/google", adminGoogleLogin);

const vehicleUpload = upload.fields([
  { name: "images", maxCount: 10 },
  // Backward-compatible single image field
  { name: "image", maxCount: 1 },
]);

router.post("/vehicle", requireAuth, requireAdmin, vehicleUpload, addVehicle);
router.put("/vehicle/:id", requireAuth, requireAdmin, vehicleUpload, updateVehicle);
router.delete("/vehicle/:id", requireAuth, requireAdmin, deleteVehicle);

router.get("/users", requireAuth, requireAdmin, listUsers);
router.put("/users/:id/status", requireAuth, requireAdmin, updateUserStatus);

router.get("/bookings", requireAuth, requireAdmin, listBookings);
router.get("/analytics", requireAuth, requireAdmin, analytics);

router.get("/messages", requireAuth, requireAdmin, listMessages);
router.post("/reply", requireAuth, requireAdmin, replyMessage);

export default router;
