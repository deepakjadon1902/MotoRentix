import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    businessName: { type: String, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    status: {
      type: String,
      enum: [
        "pending",
        "trial",
        "active",
        "renewal_due",
        "expired",
        "suspended",
        "cancelled",
        "blocked_by_admin",
        "pending_verification",
        "past_due",
        "disabled",
      ],
      default: "trial",
    },
    dashboardEnabled: { type: Boolean, default: true },
    publicWebsiteEnabled: { type: Boolean, default: true },
    publicBookingEnabled: { type: Boolean, default: true },
    apiAccessEnabled: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    marketplaceVisible: { type: Boolean, default: true },
    freeSubdomain: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    primaryDomain: { type: String, lowercase: true, trim: true },
    branding: {
      logoUrl: { type: String },
      faviconUrl: { type: String },
      primaryColor: { type: String },
      secondaryColor: { type: String },
      accentColor: { type: String },
      supportEmail: { type: String, trim: true },
      supportPhone: { type: String, trim: true },
      footerText: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

tenantSchema.index({ status: 1 });
tenantSchema.index({ freeSubdomain: 1 });
tenantSchema.index({ primaryDomain: 1 });

export default mongoose.model("Tenant", tenantSchema);
