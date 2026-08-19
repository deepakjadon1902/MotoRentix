import crypto from "crypto";
import AuditLog from "../models/AuditLog.js";
import Invoice from "../models/Invoice.js";
import License from "../models/License.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Tenant from "../models/Tenant.js";
import TenantDomain from "../models/TenantDomain.js";
import User from "../models/User.js";
import { entitlementSummary } from "./planEntitlements.js";
import { sendMail } from "./mail.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ["trial", "active", "renewal_due", "expired"];
const BLOCKED_STATUSES = ["expired", "suspended", "cancelled", "blocked_by_admin", "disabled"];
const DEFAULT_REMINDER_DAYS = [15, 7, 3, 1, 0];

export const addBillingPeriod = (billingCycle = "monthly", fromDate = new Date(), customDays) => {
  const endDate = new Date(fromDate);
  if (billingCycle === "custom" && Number(customDays) > 0) {
    endDate.setDate(endDate.getDate() + Number(customDays));
  } else if (billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (billingCycle === "half_yearly") {
    endDate.setMonth(endDate.getMonth() + 6);
  } else if (billingCycle === "quarterly") {
    endDate.setMonth(endDate.getMonth() + 3);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
};

export const subscriptionDateFields = (startDate, endDate, gracePeriodDays = 7) => ({
  purchaseDate: new Date(),
  activationDate: startDate,
  startDate,
  endDate,
  renewalDate: endDate,
  gracePeriodDays,
  graceEndsAt: new Date(endDate.getTime() + Number(gracePeriodDays || 0) * DAY_MS),
});

export const getPlanAmount = (plan, billingCycle = "monthly") =>
  plan?.billingCycles?.find?.((cycle) => cycle.cycle === billingCycle && cycle.active !== false)?.price
  ?? (billingCycle === "yearly"
    ? plan.yearlyPrice
    : billingCycle === "half_yearly"
      ? Math.round(plan.monthlyPrice * 6)
      : billingCycle === "quarterly"
        ? Math.round(plan.monthlyPrice * 3)
        : plan.monthlyPrice);

const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:8080").replace(/\/$/, "");

const invoiceNumber = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MRX-SUB-${stamp}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

const buildLicense = ({ tenantId, subscriptionId, planId, expiresAt }) => {
  const raw = `${tenantId}:${subscriptionId}:${planId}:${expiresAt.toISOString()}:${crypto.randomUUID()}`;
  const fingerprint = crypto.createHash("sha256").update(raw).digest("hex");
  return {
    licenseKey: `MRX-${fingerprint.slice(0, 8)}-${fingerprint.slice(8, 16)}-${fingerprint.slice(16, 24)}`.toUpperCase(),
    fingerprint,
  };
};

const ownerUsers = (tenantId) => User.find({ tenantId, role: "owner" }).select("email name");

const notifyTenant = async ({ tenantId, title, message, eventKey, emailSubject, emailHtml }) => {
  await Notification.create({
    tenantId,
    audience: "tenant",
    channel: "in_app",
    title,
    message,
    status: "sent",
    sentAt: new Date(),
    metadata: { eventKey },
  });

  const owners = await ownerUsers(tenantId);
  await Promise.allSettled(
    owners
      .filter((owner) => owner.email)
      .map((owner) =>
        sendMail({
          to: owner.email,
          subject: emailSubject || title,
          text: message,
          html: emailHtml || `<p>${message}</p>`,
        })
      )
  );
};

const auditSystem = (tenantId, action, entityType, entityId, metadata = {}) =>
  AuditLog.create({
    tenantId,
    action,
    entityType,
    entityId: String(entityId || ""),
    actorRole: "system",
    metadata,
  });

export const setTenantAccess = async (tenantId, enabled, status = enabled ? "active" : "suspended") => {
  const dashboardEnabled = enabled || status === "renewal_due" || status === "expired";
  const publicEnabled = enabled || status === "renewal_due";
  const userEnabled = dashboardEnabled && status !== "blocked_by_admin";
  await Promise.all([
    Tenant.findByIdAndUpdate(tenantId, {
      status,
      dashboardEnabled,
      publicWebsiteEnabled: publicEnabled,
      publicBookingEnabled: publicEnabled,
      marketplaceVisible: publicEnabled,
      apiAccessEnabled: enabled,
    }),
    User.updateMany(
      { tenantId, role: { $in: ["owner", "staff"] } },
      { status: userEnabled ? "active" : "blocked" }
    ),
    TenantDomain.updateMany(
      { tenantId },
      publicEnabled
        ? { $set: { status: "verified", redirectUrl: "", suspendedAt: null } }
        : { $set: { status: "redirected", suspendedAt: new Date(), redirectUrl: `${frontendUrl()}/subscription-expired` } }
    ),
  ]);
};

export const activateSubscriptionLifecycle = async ({
  subscription,
  plan,
  payment,
  source = "system",
  sendWelcome = true,
}) => {
  const populatedPlan = plan?.monthlyPrice !== undefined
    ? plan
    : await SubscriptionPlan.findById(plan || subscription.planId);
  if (!populatedPlan) {
    const error = new Error("Subscription plan not found for activation");
    error.statusCode = 404;
    throw error;
  }
  const license = buildLicense({
    tenantId: subscription.tenantId,
    subscriptionId: subscription._id,
    planId: populatedPlan._id || populatedPlan,
    expiresAt: new Date(subscription.endDate),
  });

  const invoice = await Invoice.create({
    tenantId: subscription.tenantId,
    subscriptionId: subscription._id,
    paymentId: payment?._id,
    invoiceNumber: subscription.invoiceNumber || invoiceNumber(),
    invoiceFor: "owner_subscription",
    subtotal: payment?.amount ?? getPlanAmount(populatedPlan, subscription.billingCycle),
    taxAmount: 0,
    total: payment?.amount ?? getPlanAmount(populatedPlan, subscription.billingCycle),
    currency: payment?.currency || "INR",
    status: "paid",
    metadata: { source, billingCycle: subscription.billingCycle },
  });

  subscription.status = "active";
  subscription.paymentStatus = "paid";
  subscription.invoiceNumber = invoice.invoiceNumber;
  subscription.licenseKey = license.licenseKey;
  subscription.licenseFingerprint = license.fingerprint;
  await subscription.save();

  await License.findOneAndUpdate(
    { subscriptionId: subscription._id },
    {
      tenantId: subscription.tenantId,
      subscriptionId: subscription._id,
      planId: populatedPlan._id || populatedPlan,
      licenseKey: license.licenseKey,
      fingerprint: license.fingerprint,
      status: "active",
      issuedAt: new Date(),
      activatedAt: new Date(),
      expiresAt: subscription.endDate,
      graceEndsAt: subscription.graceEndsAt,
      lastValidatedAt: new Date(),
      entitlementsSnapshot: entitlementSummary(populatedPlan),
      metadata: { source },
    },
    { upsert: true, new: true }
  );

  await Tenant.findByIdAndUpdate(subscription.tenantId, {
    planId: populatedPlan._id || populatedPlan,
    subscriptionId: subscription._id,
  });
  await setTenantAccess(subscription.tenantId, true, "active");
  await auditSystem(subscription.tenantId, "subscription.activate", "Subscription", subscription._id, {
    source,
    invoiceNumber: invoice.invoiceNumber,
  });

  if (sendWelcome) {
    await notifyTenant({
      tenantId: subscription.tenantId,
      eventKey: "subscription_activated",
      title: "Subscription activated",
      message: `Your subscription is active until ${new Date(subscription.endDate).toLocaleDateString("en-IN")}. Invoice ${invoice.invoiceNumber} has been generated.`,
    });
  }

  return { subscription, invoice };
};

export const suspendSubscriptionLifecycle = async (subscription, status = "suspended", eventKey = "subscription_suspended") => {
  subscription.status = status;
  subscription.autoRenew = status === "suspended" ? false : subscription.autoRenew;
  if (status !== "renewal_due") subscription.paymentStatus = subscription.paymentStatus === "paid" ? "failed" : subscription.paymentStatus;
  await subscription.save();

  await License.updateMany({ subscriptionId: subscription._id }, { status: status === "expired" ? "expired" : "suspended" });
  await setTenantAccess(subscription.tenantId, status === "renewal_due", status);
  await auditSystem(subscription.tenantId, `subscription.${status}`, "Subscription", subscription._id);
  await notifyTenant({
    tenantId: subscription.tenantId,
    eventKey,
    title: status === "expired" ? "Subscription expired" : "Account suspended",
    message: status === "expired"
      ? "Your subscription has expired. Public bookings and website access are paused until renewal."
      : "Your account has been suspended after the grace period. Your data is safe and will be restored after renewal.",
  });
};

const reminderKeyFor = (daysRemaining, now, subscription) => {
  if (daysRemaining >= 0) return `before_${daysRemaining}`;
  const graceDay = Math.ceil((now.getTime() - new Date(subscription.endDate).getTime()) / DAY_MS);
  return graceDay > 0 && graceDay % 3 === 0 ? `grace_${graceDay}` : null;
};

export const runSubscriptionAutomation = async ({ now = new Date() } = {}) => {
  const subscriptions = await Subscription.find({
    status: { $in: ACTIVE_STATUSES },
    paymentStatus: { $ne: "refunded" },
  }).populate("planId");

  let reminders = 0;
  let expired = 0;
  let suspended = 0;

  for (const subscription of subscriptions) {
    const endDate = new Date(subscription.endDate);
    const graceEndsAt = new Date(subscription.graceEndsAt || endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS);

    const shouldPreExpiryReminder = DEFAULT_REMINDER_DAYS.includes(daysRemaining);
    const shouldGraceReminder = now > endDate && now <= graceEndsAt;
    const reminderKey = reminderKeyFor(daysRemaining, now, subscription);
    if ((shouldPreExpiryReminder || shouldGraceReminder) && reminderKey && !subscription.remindersSent?.includes(reminderKey)) {
      await notifyTenant({
        tenantId: subscription.tenantId,
        eventKey: `renewal_reminder_${reminderKey}`,
        title: "Subscription renewal reminder",
        message: `Current plan: ${subscription.planId?.name || "Subscription"}. Expiry date: ${endDate.toLocaleDateString("en-IN")}. Remaining days: ${Math.max(0, daysRemaining)}. Renew here: ${frontendUrl()}/pricing`,
      });
      subscription.remindersSent = [...(subscription.remindersSent || []), reminderKey];
      subscription.lastReminderAt = now;
      await subscription.save();
      reminders += 1;
    }

    if (subscription.status !== "expired" && now > endDate && now <= graceEndsAt) {
      subscription.status = "expired";
      await subscription.save();
      await License.updateMany({ subscriptionId: subscription._id }, { status: "expired" });
      await setTenantAccess(subscription.tenantId, false, "expired");
      await auditSystem(subscription.tenantId, "subscription.grace_started", "Subscription", subscription._id);
      expired += 1;
      continue;
    }

    if (now > graceEndsAt && subscription.status !== "suspended") {
      await suspendSubscriptionLifecycle(subscription, "suspended", "account_suspended");
      suspended += 1;
    }
  }

  return { checked: subscriptions.length, reminders, expired, suspended };
};

export const expireOverdueSubscriptions = async () => {
  const result = await runSubscriptionAutomation();
  return result.suspended + result.expired;
};

export const licenseSnapshotForTenant = async (tenantId) => {
  const subscription = await Subscription.findOne({ tenantId })
    .populate("planId")
    .sort({ createdAt: -1 });
  const license = subscription
    ? await License.findOne({ subscriptionId: subscription._id }).sort({ createdAt: -1 })
    : null;

  const now = new Date();
  const status = subscription?.status || "pending_verification";
  const inGrace = Boolean(subscription?.endDate && now > new Date(subscription.endDate) && now <= new Date(subscription.graceEndsAt || subscription.endDate));
  const active = (["trial", "active", "renewal_due"].includes(status) || inGrace) && subscription?.paymentStatus !== "failed";

  return {
    active,
    status,
    inGrace,
    canLogin: active,
    canBook: active && !["expired", "suspended"].includes(status),
    canUseApi: active && !["renewal_due", "expired"].includes(status),
    subscription,
    license,
    entitlements: entitlementSummary(subscription?.planId),
  };
};

export { ACTIVE_STATUSES, BLOCKED_STATUSES };
