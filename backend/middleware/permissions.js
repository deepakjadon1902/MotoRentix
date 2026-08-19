const rolePermissions = {
  owner: ["*"],
  staff: [
    "bookings:read",
    "bookings:update",
    "customers:read",
    "customers:update",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
  ],
};

export const requireTenantFeature = (featureKey) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role === "admin") return next();
    if (!req.user.tenantId) {
      return res.status(403).json({ message: "Tenant access required" });
    }
    const { ensureFeatureEnabled } = await import("../utils/planEntitlements.js");
    await ensureFeatureEnabled(req.user.tenantId, featureKey);
    return next();
  } catch (error) {
    return res.status(error.statusCode || 403).json({ message: error.message || "Feature not available on this plan" });
  }
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role === "admin") return next();
  const permissions = rolePermissions[req.user.role] || [];
  if (permissions.includes("*") || permissions.includes(permission)) {
    return next();
  }
  return res.status(403).json({ message: "Permission denied" });
};
