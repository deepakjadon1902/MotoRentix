import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    paymentFor: { type: String, enum: ["owner_subscription", "customer_rental"], required: true },
    provider: {
      type: String,
      enum: ["manual", "razorpay", "payu", "stripe", "paypal", "upi", "cash", "bank_transfer"],
      default: "manual",
    },
    providerPaymentId: { type: String },
    providerOrderId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    metadata: { type: Object },
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model("Payment", paymentSchema);
