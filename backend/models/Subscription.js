import mongoose from "mongoose";

const subscriptionStatuses = [
  "trial",
  "active",
  "renewal_due",
  "expired",
  "suspended",
  "cancelled",
  "blocked_by_admin",
  "pending_verification",
  "past_due",
];

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    billingCycle: { type: String, enum: ["monthly", "quarterly", "half_yearly", "yearly", "custom"], default: "monthly" },
    purchaseDate: { type: Date, default: Date.now },
    activationDate: { type: Date, default: Date.now },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    renewalDate: { type: Date },
    gracePeriodDays: { type: Number, default: 7, min: 0 },
    graceEndsAt: { type: Date },
    invoiceNumber: { type: String, trim: true },
    licenseKey: { type: String, trim: true, index: true },
    licenseFingerprint: { type: String, trim: true },
    lastReminderAt: { type: Date },
    remindersSent: [{ type: String, trim: true }],
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    autoRenew: { type: Boolean, default: true },
    status: { type: String, enum: subscriptionStatuses, default: "trial", index: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);

subscriptionSchema.index({ tenantId: 1, status: 1 });

subscriptionSchema.virtual("remainingDays").get(function remainingDays() {
  if (!this.endDate) return 0;
  const diff = this.endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

export default mongoose.model("Subscription", subscriptionSchema);
