import { Router } from "express";
import {
  currentTenantLicense,
  listPublicPlans,
  runSubscriptionAutomationNow,
} from "../controllers/subscriptionController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/plans", listPublicPlans);
router.get("/me/license", requireAuth, currentTenantLicense);
router.post("/automation/run", requireAuth, requireAdmin, runSubscriptionAutomationNow);

export default router;
