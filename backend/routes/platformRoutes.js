import { Router } from "express";
import { requireAuth, requireAdmin, requireTenantUser } from "../middleware/auth.js";
import {
  createCoupon,
  createTenantSupportTicket,
  listAdminNotifications,
  listAdminSupportTickets,
  listAuditLogs,
  listCoupons,
  listSystemLogs,
  listTenantNotifications,
  listTenantSupportTickets,
  resolveWhiteLabelTenant,
  sendAdminNotification,
  updateSupportTicket,
} from "../controllers/platformController.js";

const router = Router();

router.get("/white-label/resolve", resolveWhiteLabelTenant);

router.get("/tenant/notifications", requireAuth, requireTenantUser, listTenantNotifications);
router.get("/tenant/support-tickets", requireAuth, requireTenantUser, listTenantSupportTickets);
router.post("/tenant/support-tickets", requireAuth, requireTenantUser, createTenantSupportTicket);
router.get("/tenant/coupons", requireAuth, requireTenantUser, listCoupons);
router.post("/tenant/coupons", requireAuth, requireTenantUser, createCoupon);

router.get("/admin/notifications", requireAuth, requireAdmin, listAdminNotifications);
router.post("/admin/notifications", requireAuth, requireAdmin, sendAdminNotification);
router.get("/admin/support-tickets", requireAuth, requireAdmin, listAdminSupportTickets);
router.put("/admin/support-tickets/:id", requireAuth, requireAdmin, updateSupportTicket);
router.get("/admin/coupons", requireAuth, requireAdmin, listCoupons);
router.post("/admin/coupons", requireAuth, requireAdmin, createCoupon);
router.get("/admin/audit-logs", requireAuth, requireAdmin, listAuditLogs);
router.get("/admin/system-logs", requireAuth, requireAdmin, listSystemLogs);

export default router;
