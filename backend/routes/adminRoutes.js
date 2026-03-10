import { Router } from "express";
import {
  adminLogin,
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

router.post("/vehicle", requireAuth, requireAdmin, upload.single("image"), addVehicle);
router.put("/vehicle/:id", requireAuth, requireAdmin, upload.single("image"), updateVehicle);
router.delete("/vehicle/:id", requireAuth, requireAdmin, deleteVehicle);

router.get("/users", requireAuth, requireAdmin, listUsers);
router.put("/users/:id/status", requireAuth, requireAdmin, updateUserStatus);

router.get("/bookings", requireAuth, requireAdmin, listBookings);
router.get("/analytics", requireAuth, requireAdmin, analytics);

router.get("/messages", requireAuth, requireAdmin, listMessages);
router.post("/reply", requireAuth, requireAdmin, replyMessage);

export default router;
