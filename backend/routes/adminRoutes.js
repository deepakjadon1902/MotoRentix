import { Router } from "express";
import {
  adminLogin,
  adminGoogleLogin,
  listVehiclesForAdmin,
  listUsers,
  updateUserStatus,
  listBookings,
  updateBookingStatus,
  analytics,
  listMessages,
  sendAdminMessage,
  replyMessage,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listTenants,
  createTenantClient,
  updateTenantStatus,
  assignTenantPlan,
  listPlans,
  createPlan,
  updatePlan,
  listPayments,
  listTenantDomainsForAdmin,
  upsertTenantDomainForAdmin,
  updateTenantDomainForAdmin,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/login", adminLogin);
router.post("/google", adminGoogleLogin);

router.get("/vehicles", requireAuth, requireAdmin, listVehiclesForAdmin);

router.get("/users", requireAuth, requireAdmin, listUsers);
router.put("/users/:id/status", requireAuth, requireAdmin, updateUserStatus);

router.get("/bookings", requireAuth, requireAdmin, listBookings);
router.put("/bookings/:id/status", requireAuth, requireAdmin, updateBookingStatus);
router.get("/analytics", requireAuth, requireAdmin, analytics);

router.get("/messages", requireAuth, requireAdmin, listMessages);
router.post("/messages/send", requireAuth, requireAdmin, sendAdminMessage);
router.post("/reply", requireAuth, requireAdmin, replyMessage);

router.get("/subscriptions", requireAuth, requireAdmin, listSubscriptions);
router.post("/subscriptions", requireAuth, requireAdmin, createSubscription);
router.put("/subscriptions/:id", requireAuth, requireAdmin, updateSubscription);
router.delete("/subscriptions/:id", requireAuth, requireAdmin, deleteSubscription);

router.get("/tenants", requireAuth, requireAdmin, listTenants);
router.post("/tenants", requireAuth, requireAdmin, createTenantClient);
router.put("/tenants/:id/status", requireAuth, requireAdmin, updateTenantStatus);
router.post("/tenants/:id/plan", requireAuth, requireAdmin, assignTenantPlan);
router.get("/tenants/:id/domains", requireAuth, requireAdmin, listTenantDomainsForAdmin);
router.post("/tenants/:id/domains", requireAuth, requireAdmin, upsertTenantDomainForAdmin);
router.put("/domains/:domainId", requireAuth, requireAdmin, updateTenantDomainForAdmin);

router.get("/plans", requireAuth, requireAdmin, listPlans);
router.post("/plans", requireAuth, requireAdmin, createPlan);
router.put("/plans/:id", requireAuth, requireAdmin, updatePlan);

router.get("/payments", requireAuth, requireAdmin, listPayments);

export default router;
