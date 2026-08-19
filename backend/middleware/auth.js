import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";

const getToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ message: "User is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const requireTenantUser = async (req, res, next) => {
  if (!req.user || !["owner", "staff"].includes(req.user.role) || !req.user.tenantId) {
    return res.status(403).json({ message: "Tenant access required" });
  }
  const tenant = await Tenant.findById(req.user.tenantId).select("status subscriptionId planId companyName dashboardEnabled");
  if (!tenant) {
    return res.status(403).json({ message: "Tenant account not found" });
  }
  if (!["trial", "active", "renewal_due", "expired"].includes(tenant.status) || tenant.dashboardEnabled === false) {
    return res.status(403).json({ message: "Tenant account is not active. Please renew or contact support." });
  }
  req.tenant = tenant;
  next();
};

export const requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "owner" || !req.user.tenantId) {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
};
