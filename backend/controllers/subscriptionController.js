import SubscriptionPlan from "../models/SubscriptionPlan.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { licenseSnapshotForTenant, runSubscriptionAutomation } from "../utils/subscriptionLifecycle.js";

export const listPublicPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ active: true }).sort({ sortOrder: 1, monthlyPrice: 1 });
  res.json(plans);
});

export const currentTenantLicense = asyncHandler(async (req, res) => {
  if (!req.user?.tenantId) {
    return res.status(403).json({ message: "Tenant access required" });
  }
  const snapshot = await licenseSnapshotForTenant(req.user.tenantId);
  res.json(snapshot);
});

export const runSubscriptionAutomationNow = asyncHandler(async (req, res) => {
  const result = await runSubscriptionAutomation();
  res.json({ message: "Subscription automation completed", result });
});
