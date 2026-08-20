import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Subscription from "../models/Subscription.js";
import Tenant from "../models/Tenant.js";
import TenantDomain from "../models/TenantDomain.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Payment from "../models/Payment.js";
import Branch from "../models/Branch.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateToken } from "../utils/jwt.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { uploadImageFiles } from "../utils/imageKit.js";
import { sendMail } from "../utils/mail.js";
import crypto from "crypto";
import {
  activateSubscriptionLifecycle,
  addBillingPeriod,
  expireOverdueSubscriptions,
  getPlanAmount,
  setTenantAccess,
  subscriptionDateFields,
} from "../utils/subscriptionLifecycle.js";
import { writeAuditLog } from "../utils/audit.js";

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

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.role !== "admin") {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user.status === "blocked") {
    return res.status(403).json({ message: "Admin is blocked" });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

export const adminGoogleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  const { email, emailVerified } = await verifyGoogleIdToken(credential);
  if (!emailVerified) {
    return res.status(403).json({ message: "Google account email is not verified" });
  }

  const user = await User.findOne({ email });
  if (!user || user.role !== "admin") {
    return res.status(401).json({ message: "Invalid admin account" });
  }
  if (user.status === "blocked") {
    return res.status(403).json({ message: "Admin is blocked" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

export const addVehicle = asyncHandler(async (req, res) => {
  const {
    tenantId,
    branchId,
    name,
    bikeNumber,
    category,
    description,
    features,
    engineNumber,
    chassisNumber,
    pricePerHour,
    pricePerDay,
    pricePerWeek,
    pricePerMonth,
    securityDeposit,
    availability = true,
    status,
  } = req.body;

  if (!name || !category || pricePerHour == null || pricePerDay == null) {
    return res.status(400).json({ message: "Name, category, pricePerHour, and pricePerDay are required" });
  }

  let branch = null;
  if (branchId) {
    branch = tenantId ? await Branch.findOne({ _id: branchId, tenantId }) : await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
  } else if (tenantId) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    branch = await Branch.findOne({ tenantId, status: "active" }).sort({ createdAt: 1 });
  }

  const files = req.files && typeof req.files === "object" ? req.files : {};
  const pickFiles = (key) => (Array.isArray(files[key]) ? files[key] : []);
  const imageFiles = [
    ...pickFiles("images"),
    ...pickFiles("image"),
  ]
    .filter(Boolean);
  const uploaded = await uploadImageFiles(imageFiles);

  const fallbackImage = typeof req.body.image === "string" ? req.body.image : "";
  const images = uploaded.length > 0 ? uploaded : fallbackImage ? [fallbackImage] : [];
  const image = uploaded[0] || fallbackImage;

  const vehicle = await Vehicle.create({
    tenantId: tenantId || undefined,
    branchId: branch?._id,
    name,
    bikeNumber,
    category,
    description,
    features: parseJsonArray(features),
    engineNumber,
    chassisNumber,
    image,
    images,
    pricePerHour: Number(pricePerHour),
    pricePerDay: Number(pricePerDay),
    pricePerWeek: Number(pricePerWeek || 0),
    pricePerMonth: Number(pricePerMonth || 0),
    securityDeposit: Number(securityDeposit || 0),
    availability: availability === true || availability === "true",
    status: status || (availability === false || availability === "false" ? "disabled" : "available"),
  });

  res.status(201).json(vehicle);
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  const files = req.files && typeof req.files === "object" ? req.files : {};
  const pickFiles = (key) => (Array.isArray(files[key]) ? files[key] : []);
  const imageFiles = [
    ...pickFiles("images"),
    ...pickFiles("image"),
  ]
    .filter(Boolean);
  const uploaded = await uploadImageFiles(imageFiles);

  const allowed = [
    "tenantId",
    "branchId",
    "name",
    "bikeNumber",
    "category",
    "description",
    "features",
    "engineNumber",
    "chassisNumber",
    "pricePerHour",
    "pricePerDay",
    "pricePerWeek",
    "pricePerMonth",
    "securityDeposit",
    "availability",
    "status",
    "image",
    "images",
  ];
  const updates = Object.fromEntries(
    allowed
      .filter((key) => req.body[key] !== undefined)
      .map((key) => [key, req.body[key]])
  );
  if (updates.tenantId) {
    const tenant = await Tenant.findById(updates.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
  }
  if (updates.branchId) {
    const tenantId = updates.tenantId || vehicle.tenantId;
    const branch = await Branch.findOne({ _id: updates.branchId, tenantId });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found for selected tenant" });
    }
  }
  if (updates.features !== undefined) {
    updates.features = parseJsonArray(updates.features);
  }
  ["pricePerHour", "pricePerDay", "pricePerWeek", "pricePerMonth", "securityDeposit"].forEach((key) => {
    if (updates[key] !== undefined) updates[key] = Number(updates[key] || 0);
  });
  if (updates.availability !== undefined) {
    updates.availability = updates.availability === true || updates.availability === "true";
  }
  if (uploaded.length > 0) {
    delete updates.image;
    delete updates.images;
  }
  Object.assign(vehicle, updates);

  if (uploaded.length > 0) {
    const existingImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.image ? [vehicle.image] : [];
    vehicle.images = [...existingImages, ...uploaded].slice(0, 10);
    vehicle.image = uploaded[0];
  } else {
    // Backward compatibility: if old doc only has `image`, expose at least one image.
    if (Array.isArray(vehicle.images) && vehicle.images.length === 0 && vehicle.image) {
      vehicle.images = [vehicle.image];
    }
  }
  await vehicle.save();

  res.json(vehicle);
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  const linkedBookings = await Booking.countDocuments({ vehicleId: vehicle.id });
  if (linkedBookings > 0) {
    vehicle.availability = false;
    vehicle.status = "archived";
    await vehicle.save();
    return res.json({ message: "Vehicle has booking history and was archived", archived: true });
  }

  await vehicle.deleteOne();
  res.json({ message: "Vehicle deleted" });
});

export const listBranchesForAdmin = asyncHandler(async (req, res) => {
  const filter = req.query.tenantId ? { tenantId: req.query.tenantId } : {};
  const branches = await Branch.find(filter)
    .populate("tenantId", "companyName ownerName email status")
    .sort({ createdAt: -1 });
  res.json(branches);
});

export const listVehiclesForAdmin = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find()
    .populate("tenantId", "companyName ownerName email phone status")
    .populate("branchId", "name city address status")
    .sort({ createdAt: -1 });

  res.json(
    vehicles.map((vehicle) => {
      const obj = vehicle.toObject();
      if ((!Array.isArray(obj.images) || obj.images.length === 0) && obj.image) {
        obj.images = [obj.image];
      }
      return obj;
    })
  );
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.status = status;
  await user.save();
  res.json({ message: "Status updated", user: { id: user.id, status: user.status } });
});

export const listBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("userId", "name email phone address city pincode aadhaarNumber")
    .populate("vehicleId", "name category")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "running", "completed", "cancelled", "rejected", "refunded", "overdue"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  booking.status = status;
  await booking.save();

  res.json({ message: "Booking status updated", booking });
});

export const analytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalBookings, totalVehicles, activeUsers] = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments(),
    Vehicle.countDocuments(),
    User.countDocuments({ status: "active" }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const revenueAgg = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: monthStart, $lt: monthEnd },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);

  const monthlyRevenue = revenueAgg[0]?.total || 0;

  res.json({
    totalUsers,
    totalBookings,
    totalVehicles,
    activeUsers,
    monthlyRevenue,
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate("userId", "name email role tenantId")
    .populate("sentByAdminId", "name email")
    .sort({ createdAt: -1 });
  res.json(messages);
});

export const sendAdminMessage = asyncHandler(async (req, res) => {
  const {
    audience = "selected",
    recipientIds = [],
    subject = "",
    message,
  } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  if (!["selected", "users", "collective"].includes(audience)) {
    return res.status(400).json({ message: "Invalid audience" });
  }

  const baseFilter = { status: { $ne: "blocked" }, role: { $ne: "admin" } };
  const filter = audience === "selected"
    ? { ...baseFilter, _id: { $in: Array.isArray(recipientIds) ? recipientIds : [] } }
    : audience === "users"
      ? { ...baseFilter, role: "user" }
      : baseFilter;

  if (audience === "selected" && (!Array.isArray(recipientIds) || recipientIds.length === 0)) {
    return res.status(400).json({ message: "Select at least one recipient" });
  }

  const recipients = await User.find(filter).select("name email role");
  if (recipients.length === 0) {
    return res.status(400).json({ message: "No recipients found" });
  }

  const created = await Message.insertMany(
    recipients.map((recipient) => ({
      userId: recipient.id,
      sentByAdminId: req.user.id,
      direction: "admin_to_user",
      audience,
      subject: subject?.trim(),
      message: message.trim(),
      adminReply: "",
    }))
  );

  await Promise.allSettled(
    recipients
      .filter((recipient) => recipient.email)
      .map((recipient) =>
        sendMail({
          to: recipient.email,
          subject: subject?.trim() || "MotoRentix admin message",
          text: `Hi ${recipient.name || "there"},\n\n${message.trim()}\n\nThanks,\nMotoRentix`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
              <h2 style="color:#0b5ed7">${subject?.trim() || "MotoRentix admin message"}</h2>
              <p>Hi ${recipient.name || "there"},</p>
              <p>${message.trim().replace(/\n/g, "<br />")}</p>
              <p style="color:#5f6b7a">Thanks,<br />MotoRentix</p>
            </div>
          `,
        })
      )
  );

  res.status(201).json({
    message: "Message sent",
    count: created.length,
    recipients: recipients.map((recipient) => ({
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
    })),
  });
});

export const replyMessage = asyncHandler(async (req, res) => {
  const { messageId, adminReply } = req.body;
  if (!messageId || !adminReply) {
    return res.status(400).json({ message: "messageId and adminReply are required" });
  }

  const message = await Message.findById(messageId).populate("userId", "name email");
  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  message.adminReply = adminReply;
  await message.save();

  if (message.userId?.email) {
    try {
      await sendMail({
        to: message.userId.email,
        subject: "MotoRentix support replied to your message",
        text: `Hi ${message.userId.name || "there"},\n\n${adminReply}\n\nThanks,\nMotoRentix`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
            <h2 style="color:#0b5ed7">MotoRentix support replied</h2>
            <p>Hi ${message.userId.name || "there"},</p>
            <p>${adminReply.replace(/\n/g, "<br />")}</p>
            <p style="color:#5f6b7a">Thanks,<br />MotoRentix</p>
          </div>
        `,
      });
    } catch (error) {
      console.warn("Resend email delivery failed:", error.message);
    }
  }

  res.json({ message: "Reply sent", data: message });
});

export const listSubscriptions = asyncHandler(async (req, res) => {
  await expireOverdueSubscriptions();
  const subscriptions = await Subscription.find()
    .populate("tenantId", "companyName ownerName email phone status")
    .populate("planId", "name code monthlyPrice yearlyPrice")
    .sort({ createdAt: -1 });
  res.json(subscriptions);
});

export const createSubscription = asyncHandler(async (req, res) => {
  const {
    tenantId,
    planId,
    billingCycle,
    status,
    paymentStatus,
    autoRenew,
    startDate,
    endDate,
  } = req.body;

  if (!tenantId || !planId) {
    return res.status(400).json({ message: "tenantId and planId are required" });
  }
  if (billingCycle && !["monthly", "quarterly", "half_yearly", "yearly", "custom"].includes(billingCycle)) {
    return res.status(400).json({ message: "Invalid billing cycle" });
  }

  const [tenant, plan] = await Promise.all([
    Tenant.findById(tenantId),
    SubscriptionPlan.findById(planId),
  ]);
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }
  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const starts = startDate ? new Date(startDate) : new Date();
  const ends = endDate ? new Date(endDate) : addBillingPeriod(billingCycle, starts);
  const subscription = await Subscription.create({
    tenantId,
    planId,
    billingCycle,
    status,
    paymentStatus,
    autoRenew,
    ...subscriptionDateFields(starts, ends),
  });

  await Subscription.updateMany(
    { tenantId, _id: { $ne: subscription._id }, status: { $in: ["trial", "active", "renewal_due", "past_due"] } },
    { status: "cancelled", autoRenew: false }
  );

  tenant.planId = plan.id;
  tenant.subscriptionId = subscription.id;
  tenant.status = ["trial", "active"].includes(subscription.status) && paymentStatus === "paid" ? "active" : tenant.status;
  await tenant.save();
  if (["trial", "active"].includes(subscription.status) && paymentStatus === "paid") {
    const payment = await Payment.create({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      paymentFor: "owner_subscription",
      provider: "manual",
      amount: getPlanAmount(plan, billingCycle),
      currency: "INR",
      status: "paid",
      metadata: { source: "super_admin_subscription_assignment" },
    });
    await activateSubscriptionLifecycle({
      subscription,
      plan,
      payment,
      source: "super_admin_subscription_assignment",
    });
  }

  res.status(201).json(subscription);
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const allowed = [
    "planId",
    "billingCycle",
    "status",
    "paymentStatus",
    "autoRenew",
    "startDate",
    "endDate",
    "gracePeriodDays",
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      subscription[key] = req.body[key];
    }
  });
  if (req.body.startDate || req.body.endDate) {
    const starts = new Date(subscription.startDate || new Date());
    const ends = new Date(subscription.endDate);
    Object.assign(subscription, subscriptionDateFields(starts, ends, subscription.gracePeriodDays || 7));
  }

  await subscription.save();
  if (["cancelled", "expired", "suspended", "blocked_by_admin"].includes(subscription.status)) {
    await setTenantAccess(subscription.tenantId, false, subscription.status);
  } else if (subscription.status === "active" && subscription.paymentStatus === "paid" && new Date(subscription.endDate) > new Date()) {
    await activateSubscriptionLifecycle({
      subscription,
      source: "super_admin_subscription_update",
      sendWelcome: false,
    });
  }
  res.json(subscription);
});

export const deleteSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  await subscription.deleteOne();
  res.json({ message: "Subscription deleted" });
});

export const listTenants = asyncHandler(async (req, res) => {
  await expireOverdueSubscriptions();
  const tenants = await Tenant.find()
    .populate("planId", "name code monthlyPrice yearlyPrice bikeLimit staffLimit branchLimit")
    .populate("subscriptionId", "status paymentStatus billingCycle endDate")
    .sort({ createdAt: -1 });
  res.json(tenants);
});

export const createTenantClient = asyncHandler(async (req, res) => {
  const {
    companyName,
    ownerName,
    email,
    phone,
    password,
    planId,
    billingCycle = "monthly",
    paymentStatus = "paid",
    startDate,
    endDate,
  } = req.body;

  if (!companyName || !ownerName || !email || !phone || !password || !planId) {
    return res.status(400).json({ message: "companyName, ownerName, email, phone, password, and planId are required" });
  }
  if (!["monthly", "quarterly", "half_yearly", "yearly", "custom"].includes(billingCycle)) {
    return res.status(400).json({ message: "Invalid billing cycle" });
  }

  const normalizedEmail = email.toLowerCase();
  const [existingUser, existingTenant, plan] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    Tenant.findOne({ email: normalizedEmail }),
    SubscriptionPlan.findById(planId),
  ]);

  if (existingUser || existingTenant) {
    return res.status(409).json({ message: "A client already exists with this email" });
  }
  if (!plan || !plan.active) {
    return res.status(404).json({ message: "Active plan not found" });
  }

  const starts = startDate ? new Date(startDate) : new Date();
  const ends = endDate ? new Date(endDate) : addBillingPeriod(billingCycle, starts);
  const isActive = paymentStatus === "paid" && ends > new Date();

  const tenant = await Tenant.create({
    companyName,
    ownerName,
    email: normalizedEmail,
    phone,
    planId: plan.id,
    status: isActive ? "active" : "past_due",
  });

  const branch = await Branch.create({
    tenantId: tenant.id,
    name: "Main Branch",
    phone,
    status: "active",
  });

  const owner = await User.create({
    name: ownerName,
    email: normalizedEmail,
    phone,
    password,
    role: "owner",
    tenantId: tenant.id,
    branchId: branch.id,
    status: isActive ? "active" : "blocked",
  });

  const subscription = await Subscription.create({
    tenantId: tenant.id,
    planId: plan.id,
    billingCycle,
    ...subscriptionDateFields(starts, ends),
    paymentStatus,
    autoRenew: true,
    status: isActive ? "active" : "past_due",
  });

  tenant.subscriptionId = subscription.id;
  await tenant.save();

  if (paymentStatus === "paid") {
    const payment = await Payment.create({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      paymentFor: "owner_subscription",
      provider: "manual",
      amount: getPlanAmount(plan, billingCycle),
      currency: "INR",
      status: "paid",
      metadata: { source: "super_admin_client_creation" },
    });
    await activateSubscriptionLifecycle({
      subscription,
      plan,
      payment,
      source: "super_admin_client_creation",
    });
  }

  await writeAuditLog(req, {
    action: "client.create",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { planId: plan.id, billingCycle, paymentStatus },
  });

  res.status(201).json({ tenant, owner: { id: owner.id, name: owner.name, email: owner.email }, subscription });
});

export const assignTenantPlan = asyncHandler(async (req, res) => {
  const { planId, billingCycle = "monthly", paymentStatus = "paid", startDate, endDate } = req.body;
  if (!planId) {
    return res.status(400).json({ message: "planId is required" });
  }
  if (!["monthly", "quarterly", "half_yearly", "yearly", "custom"].includes(billingCycle)) {
    return res.status(400).json({ message: "Invalid billing cycle" });
  }

  const [tenant, plan] = await Promise.all([
    Tenant.findById(req.params.id),
    SubscriptionPlan.findById(planId),
  ]);
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }
  if (!plan || !plan.active) {
    return res.status(404).json({ message: "Active plan not found" });
  }

  const starts = startDate ? new Date(startDate) : new Date();
  const ends = endDate ? new Date(endDate) : addBillingPeriod(billingCycle, starts);
  const isActive = paymentStatus === "paid" && ends > new Date();

  await Subscription.updateMany(
    { tenantId: tenant.id, status: { $in: ["trial", "active", "renewal_due", "past_due"] } },
    { status: "cancelled", autoRenew: false }
  );

  const subscription = await Subscription.create({
    tenantId: tenant.id,
    planId: plan.id,
    billingCycle,
    ...subscriptionDateFields(starts, ends),
    paymentStatus,
    autoRenew: true,
    status: isActive ? "active" : "past_due",
  });

  tenant.planId = plan.id;
  tenant.subscriptionId = subscription.id;
  tenant.status = isActive ? "active" : "past_due";
  await tenant.save();
  await setTenantAccess(tenant.id, isActive, isActive ? "active" : "past_due");

  if (paymentStatus === "paid") {
    const payment = await Payment.create({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      paymentFor: "owner_subscription",
      provider: "manual",
      amount: getPlanAmount(plan, billingCycle),
      currency: "INR",
      status: "paid",
      metadata: { source: "super_admin_plan_assignment" },
    });
    await activateSubscriptionLifecycle({
      subscription,
      plan,
      payment,
      source: "super_admin_plan_assignment",
    });
  }

  await writeAuditLog(req, {
    action: "client.assign_plan",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { planId: plan.id, subscriptionId: subscription.id, billingCycle, paymentStatus },
  });

  res.status(201).json({ tenant, subscription });
});

export const updateTenantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "trial", "active", "renewal_due", "expired", "suspended", "cancelled", "blocked_by_admin", "pending_verification", "past_due", "disabled"].includes(status)) {
    return res.status(400).json({ message: "Invalid tenant status" });
  }

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  tenant.status = status;
  await tenant.save();
  await User.updateMany({ tenantId: tenant.id, role: { $in: ["owner", "staff"] } }, {
    status: ["disabled", "cancelled", "expired", "suspended", "blocked_by_admin"].includes(status) ? "blocked" : "active",
  });

  res.json({ message: "Tenant status updated", tenant });
});

export const listTenantDomainsForAdmin = asyncHandler(async (req, res) => {
  const domains = await TenantDomain.find(req.params.id ? { tenantId: req.params.id } : {})
    .populate("tenantId", "companyName email status")
    .sort({ createdAt: -1 });
  res.json(domains);
});

export const upsertTenantDomainForAdmin = asyncHandler(async (req, res) => {
  const { domain, type = "custom", status = "pending_verification", isPrimary = false, sslStatus, dnsTarget } = req.body;
  if (!domain?.trim()) {
    return res.status(400).json({ message: "Domain is required" });
  }
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const tenantDomain = await TenantDomain.findOneAndUpdate(
    { tenantId: tenant.id, domain: normalizedDomain },
    {
      tenantId: tenant.id,
      domain: normalizedDomain,
      type,
      status,
      isPrimary,
      sslStatus: sslStatus || (["active", "verified", "ssl_enabled"].includes(status) ? "active" : "pending"),
      dnsTarget: dnsTarget || process.env.WHITE_LABEL_DNS_TARGET || "cname.motorentix.com",
      verificationToken: `motorentix-${crypto.randomBytes(16).toString("hex")}`,
      verifiedAt: ["active", "verified", "ssl_enabled"].includes(status) ? new Date() : undefined,
      lastCheckedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (isPrimary) {
    await TenantDomain.updateMany({ tenantId: tenant.id, _id: { $ne: tenantDomain._id } }, { isPrimary: false });
    tenant.primaryDomain = normalizedDomain;
    if (type === "subdomain") tenant.freeSubdomain = normalizedDomain;
    await tenant.save();
  }

  res.status(201).json(tenantDomain);
});

export const updateTenantDomainForAdmin = asyncHandler(async (req, res) => {
  const domain = await TenantDomain.findById(req.params.domainId);
  if (!domain) {
    return res.status(404).json({ message: "Domain not found" });
  }

  ["domain", "type", "status", "isPrimary", "sslStatus", "dnsTarget", "redirectUrl"].forEach((key) => {
    if (req.body[key] !== undefined) domain[key] = typeof req.body[key] === "string" ? req.body[key].trim().toLowerCase() : req.body[key];
  });
  if (["active", "verified", "ssl_enabled"].includes(domain.status)) {
    domain.verifiedAt = domain.verifiedAt || new Date();
    domain.suspendedAt = undefined;
    domain.redirectUrl = "";
  }
  if (["disabled", "redirected", "expired"].includes(domain.status)) {
    domain.suspendedAt = domain.suspendedAt || new Date();
  }
  domain.lastCheckedAt = new Date();
  await domain.save();

  if (domain.isPrimary) {
    await TenantDomain.updateMany({ tenantId: domain.tenantId, _id: { $ne: domain._id } }, { isPrimary: false });
    await Tenant.findByIdAndUpdate(domain.tenantId, {
      primaryDomain: domain.domain,
      ...(domain.type === "subdomain" ? { freeSubdomain: domain.domain } : {}),
    });
  }

  res.json(domain);
});

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, monthlyPrice: 1 });
  res.json(plans);
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  res.status(201).json(plan);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  Object.assign(plan, req.body);
  await plan.save();
  res.json(plan);
});

export const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("tenantId", "companyName email")
    .populate("subscriptionId", "billingCycle status")
    .populate({
      path: "bookingId",
      select: "totalPrice status paymentStatus startDate endDate durationType userId vehicleId",
      populate: [
        { path: "userId", select: "name email phone address city pincode aadhaarNumber" },
        { path: "vehicleId", select: "name category bikeNumber" },
      ],
    })
    .sort({ createdAt: -1 });
  res.json(payments);
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["paid", "failed", "refunded"].includes(status)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }
  if (payment.provider === "razorpay") {
    return res.status(400).json({ message: "Razorpay payments are verified automatically by the server and webhook" });
  }
  if (!["upi", "cash", "bank_transfer", "manual"].includes(payment.provider)) {
    return res.status(400).json({ message: "This payment method cannot be manually verified here" });
  }

  payment.status = status;
  payment.metadata = {
    ...(payment.metadata || {}),
    manualVerification: {
      status,
      adminId: req.user.id,
      verifiedAt: new Date().toISOString(),
    },
  };
  await payment.save();

  if (payment.bookingId) {
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = status;
      if (status === "paid") {
        booking.status = "confirmed";
        await Vehicle.findByIdAndUpdate(booking.vehicleId, { availability: false, status: "booked" });
      } else if (status === "failed") {
        booking.status = booking.status === "confirmed" ? "pending" : booking.status;
      }
      await booking.save();
    }
  }

  const populated = await Payment.findById(payment.id)
    .populate("tenantId", "companyName email")
    .populate("subscriptionId", "billingCycle status")
    .populate({
      path: "bookingId",
      select: "totalPrice status paymentStatus startDate endDate durationType userId vehicleId",
      populate: [
        { path: "userId", select: "name email phone address city pincode aadhaarNumber" },
        { path: "vehicleId", select: "name category bikeNumber" },
      ],
    });

  res.json(populated);
});
