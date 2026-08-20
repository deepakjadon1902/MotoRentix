import { Router } from "express";
import {
  adminLogin,
  adminGoogleLogin,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  listVehiclesForAdmin,
  listBranchesForAdmin,
  listUsers,
  updateUserStatus,
  listBookings,
  updateBookingStatus,
  analytics,
  listMessages,
  sendAdminMessage,
  replyMessage,
  listPayments,
  updatePaymentStatus,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();
const vehicleUpload = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
]);

router.post("/login", adminLogin);
router.post("/google", adminGoogleLogin);

router.get("/vehicles", requireAuth, requireAdmin, listVehiclesForAdmin);
router.post("/vehicles", requireAuth, requireAdmin, vehicleUpload, addVehicle);
router.put("/vehicles/:id", requireAuth, requireAdmin, vehicleUpload, updateVehicle);
router.delete("/vehicles/:id", requireAuth, requireAdmin, deleteVehicle);
router.get("/branches", requireAuth, requireAdmin, listBranchesForAdmin);

router.get("/users", requireAuth, requireAdmin, listUsers);
router.put("/users/:id/status", requireAuth, requireAdmin, updateUserStatus);

router.get("/bookings", requireAuth, requireAdmin, listBookings);
router.put("/bookings/:id/status", requireAuth, requireAdmin, updateBookingStatus);
router.get("/analytics", requireAuth, requireAdmin, analytics);

router.get("/messages", requireAuth, requireAdmin, listMessages);
router.post("/messages/send", requireAuth, requireAdmin, sendAdminMessage);
router.post("/reply", requireAuth, requireAdmin, replyMessage);

router.get("/payments", requireAuth, requireAdmin, listPayments);
router.put("/payments/:id/status", requireAuth, requireAdmin, updatePaymentStatus);

export default router;
