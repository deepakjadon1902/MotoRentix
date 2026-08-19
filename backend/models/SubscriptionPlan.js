import mongoose from "mongoose";

const billingCycleSchema = new mongoose.Schema(
  {
    cycle: { type: String, enum: ["monthly", "half_yearly", "yearly"], required: true },
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    months: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const navigationItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    featureKey: { type: String, required: true, trim: true },
    exact: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const comparisonFeatureSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    featureKey: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "Core" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    billingCycles: { type: [billingCycleSchema], default: [] },
    bikeLimit: { type: Number, default: 25 },
    staffLimit: { type: Number, default: 2 },
    branchLimit: { type: Number, default: 1 },
    bookingLimit: { type: Number, default: 0 },
    storageLimitMb: { type: Number, default: 1024 },
    bandwidthLimitGb: { type: Number, default: 25 },
    apiLimitMonthly: { type: Number, default: 0 },
    customDomainLimit: { type: Number, default: 0 },
    analyticsLevel: { type: String, enum: ["basic", "advanced", "full"], default: "basic" },
    supportLevel: { type: String, enum: ["standard", "priority", "dedicated"], default: "standard" },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    digitalAgreements: { type: Boolean, default: false },
    whatsappIntegration: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    crm: { type: Boolean, default: false },
    maintenanceModule: { type: Boolean, default: false },
    featureFlags: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    gatewayAvailability: { type: Map, of: Boolean, default: {} },
    planBadges: [{ type: String, trim: true }],
    recommendedFor: { type: String, trim: true },
    featureList: [{ type: String, trim: true }],
    hiddenFeatureList: [{ type: String, trim: true }],
    navigationItems: { type: [navigationItemSchema], default: [] },
    comparisonFeatures: { type: [comparisonFeatureSchema], default: [] },
    faqs: [{
      question: { type: String, trim: true },
      answer: { type: String, trim: true },
    }],
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
