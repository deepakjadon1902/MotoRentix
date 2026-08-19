import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["subscription", "rental", "both"], default: "rental" },
    maxRedemptions: { type: Number, default: 0 },
    redeemedCount: { type: Number, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.model("Coupon", couponSchema);
