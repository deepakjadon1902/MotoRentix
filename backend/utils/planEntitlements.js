import Subscription from "../models/Subscription.js";

export const getActivePlanForTenant = async (tenantId) => {
  const now = new Date();
  const subscription = await Subscription.findOne({
    tenantId,
    status: { $in: ["trial", "active", "renewal_due", "expired"] },
    paymentStatus: { $ne: "failed" },
    $or: [
      { endDate: { $gt: now } },
      { graceEndsAt: { $gte: now } },
    ],
  })
    .populate("planId")
    .sort({ createdAt: -1 });

  return subscription?.planId || null;
};

export const isUnlimited = (value) => Number(value) === 0;

const mapToObject = (value = {}) => {
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return value?.toObject?.() || value || {};
};

export const ensureWithinLimit = async ({ tenantId, model, limitField, countFilter, label }) => {
  const plan = await getActivePlanForTenant(tenantId);
  if (!plan) return null;

  const limit = Number(plan[limitField] || 0);
  if (isUnlimited(limit)) return plan;

  const count = await model.countDocuments(countFilter || { tenantId });
  if (count >= limit) {
    const error = new Error(`Your plan allows only ${limit} ${label || limitField.replace("Limit", "")} records`);
    error.statusCode = 403;
    throw error;
  }
  return plan;
};

export const ensureFeatureEnabled = async (tenantId, featureKey) => {
  const plan = await getActivePlanForTenant(tenantId);
  if (!plan) return null;

  const flags = mapToObject(plan.featureFlags);
  const enabled = Boolean(flags[featureKey] || plan[featureKey]);
  if (!enabled) {
    const error = new Error(`Your current plan does not include ${featureKey}`);
    error.statusCode = 403;
    throw error;
  }
  return plan;
};

export const sanitizePaymentMethodsForPlan = (paymentMethods = {}, plan) => {
  const gateways = mapToObject(plan?.gatewayAvailability);
  return Object.fromEntries(
    Object.entries(paymentMethods).map(([provider, config]) => {
      if (gateways[provider] === false) {
        return [provider, { ...(config?.toObject?.() || config || {}), enabled: false }];
      }
      return [provider, config];
    })
  );
};

export const entitlementSummary = (plan) => {
  if (!plan) return null;
  const obj = plan.toObject?.() || plan;
  return {
    planId: obj._id || obj.id,
    code: obj.code,
    name: obj.name,
    limits: {
      vehicles: obj.bikeLimit,
      staff: obj.staffLimit,
      branches: obj.branchLimit,
      bookings: obj.bookingLimit,
      storageMb: obj.storageLimitMb,
      bandwidthGb: obj.bandwidthLimitGb,
      apiMonthly: obj.apiLimitMonthly,
      customDomains: obj.customDomainLimit,
    },
    analyticsLevel: obj.analyticsLevel,
    supportLevel: obj.supportLevel,
    customBranding: obj.customBranding,
    apiAccess: obj.apiAccess,
    gateways: mapToObject(obj.gatewayAvailability),
    billingCycles: obj.billingCycles || [],
    navigationItems: (obj.navigationItems || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    comparisonFeatures: (obj.comparisonFeatures || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    faqs: obj.faqs || [],
    features: {
      digitalAgreements: obj.digitalAgreements,
      whatsappIntegration: obj.whatsappIntegration,
      advancedReports: obj.advancedReports,
      inventory: obj.inventory,
      crm: obj.crm,
      maintenanceModule: obj.maintenanceModule,
      ...mapToObject(obj.featureFlags),
    },
    featureList: obj.featureList || [],
    hiddenFeatureList: obj.hiddenFeatureList || [],
    badges: obj.planBadges || [],
    recommendedFor: obj.recommendedFor,
  };
};
