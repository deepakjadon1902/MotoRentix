import mongoose from "mongoose";

const tenantDomainSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    domain: { type: String, required: true, lowercase: true, trim: true, unique: true },
    type: { type: String, enum: ["subdomain", "custom"], required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "active",
        "verified",
        "ssl_enabled",
        "expired",
        "disabled",
        "redirected",
        "disconnected",
      ],
      default: "pending_verification",
      index: true,
    },
    suspendedAt: { type: Date },
    redirectUrl: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    verificationToken: { type: String, required: true, trim: true },
    dnsTarget: { type: String, trim: true },
    sslStatus: { type: String, enum: ["pending", "active", "failed", "expired"], default: "pending" },
    verifiedAt: { type: Date },
    lastCheckedAt: { type: Date },
  },
  { timestamps: true }
);

tenantDomainSchema.index({ tenantId: 1, isPrimary: 1 });

export default mongoose.model("TenantDomain", tenantDomainSchema);
