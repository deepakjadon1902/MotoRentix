import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Customer from "../models/Customer.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import TenantSettings from "../models/TenantSettings.js";
import Tenant from "../models/Tenant.js";
import TenantDomain from "../models/TenantDomain.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { uploadImageFiles } from "../utils/imageKit.js";
import crypto from "crypto";
import {
  ensureFeatureEnabled,
  ensureWithinLimit,
  entitlementSummary,
  getActivePlanForTenant,
  sanitizePaymentMethodsForPlan,
} from "../utils/planEntitlements.js";

const tenantFilter = (req) => ({ tenantId: req.user.tenantId });

const mergePaymentMethods = (current = {}, incoming = {}) => {
  const currentObj = current?.toObject?.() || current || {};
  const secretFields = new Set(["keySecret", "webhookSecret", "salt", "secretKey"]);
  return Object.fromEntries(
    Object.entries(incoming).map(([provider, value]) => {
      const existingProvider = currentObj[provider] || {};
      const incomingProvider = value || {};
      const nextProvider = { ...existingProvider, ...incomingProvider };
      secretFields.forEach((field) => {
        if (incomingProvider[field] === "") {
          nextProvider[field] = existingProvider[field];
        }
      });
      return [provider, nextProvider];
    })
  );
};

const enforcePlanLimit = async ({ tenantId, model, limitField }) => {
  const filter = model.modelName === "User" ? { tenantId, role: "staff" } : { tenantId };
  return ensureWithinLimit({ tenantId, model, limitField, countFilter: filter });
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

export const tenantOverview = asyncHandler(async (req, res) => {
  const filter = tenantFilter(req);
  const [vehicles, bookings, customers, branches, staff, subscription] = await Promise.all([
    Vehicle.countDocuments(filter),
    Booking.countDocuments(filter),
    Customer.countDocuments(filter),
    Branch.countDocuments(filter),
    User.countDocuments({ ...filter, role: "staff" }),
    Subscription.findOne(filter).populate("planId").sort({ createdAt: -1 }),
  ]);

  const revenueAgg = await Booking.aggregate([
    { $match: { tenantId: req.user.tenantId, status: { $in: ["confirmed", "completed"] } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);

  res.json({
    vehicles,
    bookings,
    customers,
    branches,
    staff,
    rentalRevenue: revenueAgg[0]?.total || 0,
    plan: subscription?.planId || null,
    subscription: subscription ? {
      ...subscription.toObject(),
      remainingDays: Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    } : null,
    entitlements: entitlementSummary(subscription?.planId),
  });
});

export const listTenantVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find(tenantFilter(req)).sort({ createdAt: -1 });
  res.json(vehicles);
});

export const createTenantVehicle = asyncHandler(async (req, res) => {
  await enforcePlanLimit({ tenantId: req.user.tenantId, model: Vehicle, limitField: "bikeLimit" });
  const {
    name,
    bikeNumber,
    category,
    description,
    pricePerHour,
    pricePerDay,
    pricePerWeek,
    pricePerMonth,
    securityDeposit,
    availability,
    branchId,
    features,
    engineNumber,
    chassisNumber,
    status,
  } = req.body;
  if (!name || !category || pricePerHour == null || pricePerDay == null) {
    return res.status(400).json({ message: "name, category, pricePerHour, and pricePerDay are required" });
  }

  const files = req.files && typeof req.files === "object" ? req.files : {};
  const uploaded = await uploadImageFiles([...(files.images || []), ...(files.image || [])]);
  const fallbackImage = typeof req.body.image === "string" ? req.body.image : "";
  const images = uploaded.length > 0 ? uploaded : fallbackImage ? [fallbackImage] : [];

  const vehicle = await Vehicle.create({
    tenantId: req.user.tenantId,
    branchId: branchId || req.user.branchId,
    name,
    bikeNumber,
    category,
    description,
    features: parseJsonArray(features),
    engineNumber,
    chassisNumber,
    image: images[0],
    images,
    pricePerHour,
    pricePerDay,
    pricePerWeek,
    pricePerMonth,
    securityDeposit,
    availability,
    status: status || (availability === "false" ? "disabled" : "available"),
  });

  res.status(201).json(vehicle);
});

export const updateTenantVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  const files = req.files && typeof req.files === "object" ? req.files : {};
  const uploaded = await uploadImageFiles([...(files.images || []), ...(files.image || [])]);
  const updates = { ...req.body };
  if (updates.features !== undefined) {
    updates.features = parseJsonArray(updates.features);
  }
  Object.assign(vehicle, updates);
  if (uploaded.length > 0) {
    vehicle.images = uploaded;
    vehicle.image = uploaded[0];
  }
  await vehicle.save();
  res.json(vehicle);
});

export const deleteTenantVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  await vehicle.deleteOne();
  res.json({ message: "Vehicle deleted" });
});

export const listTenantBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find(tenantFilter(req))
    .populate("customerId", "name email phone")
    .populate("userId", "name email phone")
    .populate("vehicleId", "name bikeNumber category")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export const updateTenantBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "running", "completed", "cancelled", "rejected", "refunded", "overdue"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const booking = await Booking.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  booking.status = status;
  await booking.save();
  res.json(booking);
});

export const listCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find(tenantFilter(req)).sort({ createdAt: -1 });
  res.json(customers);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, city, pincode, aadhaarNumber, status = "active" } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Customer name is required" });
  }
  const customer = await Customer.create({
    tenantId: req.user.tenantId,
    name,
    email,
    phone,
    address,
    city,
    pincode,
    aadhaarNumber,
    status,
  });
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  const allowed = ["name", "email", "phone", "address", "city", "pincode", "aadhaarNumber", "status"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) customer[key] = req.body[key];
  });
  await customer.save();
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  await customer.deleteOne();
  res.json({ message: "Customer deleted" });
});

export const listTenantUsers = asyncHandler(async (req, res) => {
  const plan = await getActivePlanForTenant(req.user.tenantId);
  const features = plan?.featureFlags instanceof Map
    ? Object.fromEntries(plan.featureFlags.entries())
    : plan?.featureFlags?.toObject?.() || plan?.featureFlags || {};
  const canViewStaff = Boolean(features.staffManagement || features.rolePermissions);
  const [customers, staff] = await Promise.all([
    Customer.find(tenantFilter(req)).sort({ createdAt: -1 }),
    canViewStaff
      ? User.find({ ...tenantFilter(req), role: { $in: ["owner", "staff"] } }).select("-password").sort({ createdAt: -1 })
      : Promise.resolve([]),
  ]);
  res.json({ customers, staff });
});

export const listTenantPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find(tenantFilter(req))
    .populate("bookingId", "durationType startDate endDate totalPrice status")
    .populate("subscriptionId", "billingCycle status paymentStatus endDate")
    .sort({ createdAt: -1 });
  res.json(payments);
});

export const getTenantSettings = asyncHandler(async (req, res) => {
  const [settings, tenant, plan, domains] = await Promise.all([
    TenantSettings.findOneAndUpdate(
    tenantFilter(req),
    { $setOnInsert: { tenantId: req.user.tenantId } },
    { new: true, upsert: true }
    ),
    Tenant.findById(req.user.tenantId).select("companyName businessName email phone gstNumber address city state country branding freeSubdomain primaryDomain status marketplaceVisible"),
    getActivePlanForTenant(req.user.tenantId),
    TenantDomain.find({ tenantId: req.user.tenantId }).sort({ isPrimary: -1, createdAt: -1 }),
  ]);
  res.json({
    ...settings.toObject(),
    tenant,
    domains,
    entitlements: entitlementSummary(plan),
  });
});

export const updateTenantSettings = asyncHandler(async (req, res) => {
  const [existing, plan] = await Promise.all([
    TenantSettings.findOne(tenantFilter(req)),
    getActivePlanForTenant(req.user.tenantId),
  ]);
  if (req.body.theme) {
    await ensureFeatureEnabled(req.user.tenantId, "themeBuilder");
  }
  if (req.body.seo) {
    await ensureFeatureEnabled(req.user.tenantId, "seoSettings");
  }
  if (req.body.localization?.enabledLanguages?.length > 1 && !plan?.featureFlags?.multiLanguage) {
    await ensureFeatureEnabled(req.user.tenantId, "multiLanguage");
  }

  const paymentMethods = req.body.paymentMethods
    ? sanitizePaymentMethodsForPlan(mergePaymentMethods(existing?.paymentMethods, req.body.paymentMethods), plan)
    : undefined;
  const allowed = {
    paymentMethods,
    branding: req.body.branding,
    theme: req.body.theme,
    policies: req.body.policies,
    seo: req.body.seo,
    templates: req.body.templates,
    localization: req.body.localization,
    integrations: req.body.integrations,
    mobileBranding: req.body.mobileBranding,
    invoice: req.body.invoice,
    businessHours: req.body.businessHours,
  };
  const updates = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  const settings = await TenantSettings.findOneAndUpdate(
    tenantFilter(req),
    { $set: updates, $setOnInsert: { tenantId: req.user.tenantId } },
    { new: true, upsert: true }
  );
  res.json(settings);
});

export const createTenantDomain = asyncHandler(async (req, res) => {
  const { domain, type = "custom", makePrimary = false } = req.body;
  if (!domain?.trim()) {
    return res.status(400).json({ message: "Domain is required" });
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const plan = await getActivePlanForTenant(req.user.tenantId);
  if (type === "custom") {
    await ensureFeatureEnabled(req.user.tenantId, "customDomain");
    const limit = Number(plan?.customDomainLimit || 0);
    if (limit > 0) {
      const current = await TenantDomain.countDocuments({ tenantId: req.user.tenantId, type: "custom", status: { $ne: "disconnected" } });
      if (current >= limit) {
        return res.status(403).json({ message: `Your plan allows only ${limit} custom domains` });
      }
    }
  }

  const verificationToken = `motorentix-${crypto.randomBytes(16).toString("hex")}`;
  const created = await TenantDomain.create({
    tenantId: req.user.tenantId,
    domain: normalizedDomain,
    type,
    isPrimary: Boolean(makePrimary),
    verificationToken,
    dnsTarget: process.env.WHITE_LABEL_DNS_TARGET || "cname.motorentix.com",
  });

  if (makePrimary) {
    await TenantDomain.updateMany({ tenantId: req.user.tenantId, _id: { $ne: created._id } }, { isPrimary: false });
    await Tenant.findByIdAndUpdate(req.user.tenantId, {
      primaryDomain: normalizedDomain,
      ...(type === "subdomain" ? { freeSubdomain: normalizedDomain } : {}),
    });
  }

  res.status(201).json(created);
});

export const updateTenantDomain = asyncHandler(async (req, res) => {
  const domain = await TenantDomain.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!domain) {
    return res.status(404).json({ message: "Domain not found" });
  }
  if (req.body.status && ["pending", "pending_verification", "active", "verified", "ssl_enabled", "expired", "disabled", "redirected", "disconnected"].includes(req.body.status)) {
    domain.status = req.body.status;
    if (["active", "verified", "ssl_enabled"].includes(req.body.status)) {
      domain.verifiedAt = new Date();
      domain.sslStatus = "active";
    }
  }
  if (req.body.isPrimary !== undefined) {
    domain.isPrimary = Boolean(req.body.isPrimary);
  }
  domain.lastCheckedAt = new Date();
  await domain.save();

  if (domain.isPrimary) {
    await TenantDomain.updateMany({ tenantId: req.user.tenantId, _id: { $ne: domain._id } }, { isPrimary: false });
    await Tenant.findByIdAndUpdate(req.user.tenantId, {
      primaryDomain: domain.domain,
      ...(domain.type === "subdomain" ? { freeSubdomain: domain.domain } : {}),
    });
  }

  res.json(domain);
});

export const listBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find(tenantFilter(req)).sort({ createdAt: -1 });
  res.json(branches);
});

export const createBranch = asyncHandler(async (req, res) => {
  await enforcePlanLimit({ tenantId: req.user.tenantId, model: Branch, limitField: "branchLimit" });
  const { name, phone, address, city, pincode } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Branch name is required" });
  }
  const branch = await Branch.create({ tenantId: req.user.tenantId, name, phone, address, city, pincode });
  res.status(201).json(branch);
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  ["name", "phone", "address", "city", "pincode", "status"].forEach((key) => {
    if (req.body[key] !== undefined) branch[key] = req.body[key];
  });
  await branch.save();
  res.json(branch);
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  const vehicleCount = await Vehicle.countDocuments({ tenantId: req.user.tenantId, branchId: branch.id });
  const staffCount = await User.countDocuments({ tenantId: req.user.tenantId, branchId: branch.id });
  if (vehicleCount || staffCount) {
    branch.status = "disabled";
    await branch.save();
    return res.json({ message: "Branch has assigned records and was disabled instead", branch });
  }
  await branch.deleteOne();
  res.json({ message: "Branch deleted" });
});

export const listStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ ...tenantFilter(req), role: "staff" }).select("-password").sort({ createdAt: -1 });
  res.json(staff);
});

export const createStaff = asyncHandler(async (req, res) => {
  await enforcePlanLimit({ tenantId: req.user.tenantId, model: User, limitField: "staffLimit" });
  const { name, email, phone, password, branchId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, and password are required" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const staff = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: "staff",
    tenantId: req.user.tenantId,
    branchId: branchId || req.user.branchId,
    status: "active",
  });
  const obj = staff.toObject();
  delete obj.password;
  res.status(201).json(obj);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId, role: "staff" });
  if (!staff) {
    return res.status(404).json({ message: "Staff not found" });
  }
  ["name", "phone", "branchId", "status"].forEach((key) => {
    if (req.body[key] !== undefined) staff[key] = req.body[key];
  });
  if (req.body.email !== undefined) staff.email = req.body.email.toLowerCase();
  if (req.body.password) staff.password = req.body.password;
  await staff.save();
  const obj = staff.toObject();
  delete obj.password;
  res.json(obj);
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId, role: "staff" });
  if (!staff) {
    return res.status(404).json({ message: "Staff not found" });
  }
  await staff.deleteOne();
  res.json({ message: "Staff deleted" });
});
