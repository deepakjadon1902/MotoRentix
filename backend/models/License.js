import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    licenseKey: { type: String, required: true, unique: true, trim: true },
    fingerprint: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "active", "renewal_due", "expired", "suspended", "cancelled", "blocked"],
      default: "pending",
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    activatedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    graceEndsAt: { type: Date },
    lastValidatedAt: { type: Date },
    entitlementsSnapshot: { type: Object },
    metadata: { type: Object },
  },
  { timestamps: true }
);

licenseSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model("License", licenseSchema);
