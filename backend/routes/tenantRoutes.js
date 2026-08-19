import { Router } from "express";
import { requireAuth, requireOwner, requireTenantUser } from "../middleware/auth.js";
import { requirePermission, requireTenantFeature } from "../middleware/permissions.js";
import upload from "../middleware/upload.js";
import {
  createBranch,
  createCustomer,
  createTenantDomain,
  createStaff,
  createTenantVehicle,
  deleteTenantVehicle,
  deleteBranch,
  deleteCustomer,
  deleteStaff,
  getTenantSettings,
  listBranches,
  listCustomers,
  listTenantPayments,
  listTenantUsers,
  listStaff,
  listTenantBookings,
  listTenantVehicles,
  tenantOverview,
  updateTenantSettings,
  updateTenantDomain,
  updateTenantBookingStatus,
  updateTenantVehicle,
  updateBranch,
  updateCustomer,
  updateStaff,
} from "../controllers/tenantController.js";

const router = Router();
const vehicleUpload = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
]);

router.use(requireAuth, requireTenantUser);
router.get("/overview", tenantOverview);
router.get("/vehicles", requirePermission("vehicles:read"), listTenantVehicles);
router.post("/vehicles", requirePermission("vehicles:create"), vehicleUpload, createTenantVehicle);
router.put("/vehicles/:id", requirePermission("vehicles:update"), vehicleUpload, updateTenantVehicle);
router.delete("/vehicles/:id", requirePermission("vehicles:update"), deleteTenantVehicle);
router.get("/bookings", requirePermission("bookings:read"), listTenantBookings);
router.put("/bookings/:id/status", requirePermission("bookings:update"), updateTenantBookingStatus);
router.get("/customers", requirePermission("customers:read"), listCustomers);
router.post("/customers", requirePermission("customers:update"), createCustomer);
router.put("/customers/:id", requirePermission("customers:update"), updateCustomer);
router.delete("/customers/:id", requirePermission("customers:update"), deleteCustomer);
router.get("/users", requirePermission("customers:read"), listTenantUsers);
router.get("/payments", listTenantPayments);
router.get("/branches", requireTenantFeature("branchManagement"), listBranches);
router.post("/branches", requireOwner, requireTenantFeature("branchManagement"), createBranch);
router.put("/branches/:id", requireOwner, requireTenantFeature("branchManagement"), updateBranch);
router.delete("/branches/:id", requireOwner, requireTenantFeature("branchManagement"), deleteBranch);
router.get("/staff", requireTenantFeature("staffManagement"), listStaff);
router.post("/staff", requireOwner, requireTenantFeature("staffManagement"), createStaff);
router.put("/staff/:id", requireOwner, requireTenantFeature("staffManagement"), updateStaff);
router.delete("/staff/:id", requireOwner, requireTenantFeature("staffManagement"), deleteStaff);
router.get("/settings", requireOwner, getTenantSettings);
router.put("/settings", requireOwner, updateTenantSettings);
router.post("/domains", requireOwner, createTenantDomain);
router.put("/domains/:id", requireOwner, updateTenantDomain);

export default router;
