import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import SupportTicket from "../models/SupportTicket.js";
import AuditLog from "../models/AuditLog.js";
import SystemLog from "../models/SystemLog.js";
import Tenant from "../models/Tenant.js";
import TenantDomain from "../models/TenantDomain.js";
import TenantSettings from "../models/TenantSettings.js";
import asyncHandler from "../middleware/asyncHandler.js";

const tenantScoped = (req) => ({ tenantId: req.user.tenantId });

export const resolveWhiteLabelTenant = asyncHandler(async (req, res) => {
  const host = String(req.query.host || req.hostname || req.get("host") || "")
    .toLowerCase()
    .replace(/:\d+$/, "");
  const explicitTenantId = req.query.tenantId;

  let tenant = req.hostTenant || null;
  let domain = null;
  if (explicitTenantId) {
    tenant = await Tenant.findById(explicitTenantId);
  } else if (!tenant && host) {
    domain = await TenantDomain.findOne({ domain: host, status: { $in: ["active", "verified", "ssl_enabled"] } });
    tenant = domain
      ? await Tenant.findById(domain.tenantId)
      : await Tenant.findOne({ $or: [{ primaryDomain: host }, { freeSubdomain: host }] });
  }

  if (tenant && ["expired", "suspended", "disabled", "cancelled", "blocked_by_admin"].includes(tenant.status)) {
    return res.status(402).json({
      message: "Subscription expired. Please contact company.",
      status: tenant.status,
    });
  }

  if (!tenant || !["trial", "active", "renewal_due"].includes(tenant.status) || tenant.publicWebsiteEnabled === false) {
    return res.status(404).json({ message: "Tenant site not found" });
  }

  const settings = await TenantSettings.findOne({ tenantId: tenant.id }).select("branding theme seo policies localization businessHours invoice");
  res.json({
    tenant: {
      id: tenant.id,
      companyName: tenant.companyName,
      businessName: tenant.businessName,
      status: tenant.status,
      marketplaceVisible: tenant.marketplaceVisible,
      primaryDomain: tenant.primaryDomain,
      freeSubdomain: tenant.freeSubdomain,
      branding: tenant.branding,
    },
    domain,
    settings,
  });
});

export const listTenantNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [
      { tenantId: req.user.tenantId },
      { audience: "all_clients" },
    ],
  }).sort({ createdAt: -1 });
  res.json(notifications);
});

export const createTenantSupportTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority = "medium" } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: "subject and message are required" });
  }
  const ticket = await SupportTicket.create({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    subject,
    message,
    priority,
  });
  res.status(201).json(ticket);
});

export const listTenantSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find(tenantScoped(req)).sort({ createdAt: -1 });
  res.json(tickets);
});

export const listAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate("tenantId", "companyName email").sort({ createdAt: -1 });
  res.json(notifications);
});

export const sendAdminNotification = asyncHandler(async (req, res) => {
  const {
    tenantId,
    audience = tenantId ? "tenant" : "all_clients",
    channel = "in_app",
    title,
    message,
    scheduledAt,
  } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required" });
  }
  const notification = await Notification.create({
    tenantId,
    audience,
    channel,
    title,
    message,
    status: scheduledAt ? "scheduled" : "sent",
    scheduledAt,
    sentAt: scheduledAt ? undefined : new Date(),
  });
  res.status(201).json(notification);
});

export const listAdminSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find()
    .populate("tenantId", "companyName email")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(tickets);
});

export const updateSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: "Support ticket not found" });
  }
  if (req.body.status !== undefined) ticket.status = req.body.status;
  if (req.body.priority !== undefined) ticket.priority = req.body.priority;
  if (req.body.reply) {
    ticket.replies.push({ userId: req.user.id, message: req.body.reply });
  }
  await ticket.save();
  res.json(ticket);
});

export const listCoupons = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : tenantScoped(req);
  const coupons = await Coupon.find(filter).populate("tenantId", "companyName email").sort({ createdAt: -1 });
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const tenantId = req.user.role === "admin" ? req.body.tenantId : req.user.tenantId;
  const { code, discountType, discountValue, appliesTo, description, maxRedemptions, startsAt, expiresAt, active } = req.body;
  if (!code || discountValue == null) {
    return res.status(400).json({ message: "code and discountValue are required" });
  }
  const coupon = await Coupon.create({
    tenantId,
    code,
    discountType,
    discountValue,
    appliesTo,
    description,
    maxRedemptions,
    startsAt,
    expiresAt,
    active,
  });
  res.status(201).json(coupon);
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate("actorId", "name email role").sort({ createdAt: -1 }).limit(500);
  res.json(logs);
});

export const listSystemLogs = asyncHandler(async (req, res) => {
  const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(500);
  res.json(logs);
});
