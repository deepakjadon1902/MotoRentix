import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    invoiceNumber: { type: String, required: true, trim: true },
    invoiceFor: { type: String, enum: ["customer_rental", "owner_subscription"], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["draft", "issued", "paid", "void"], default: "issued" },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: Object },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.model("Invoice", invoiceSchema);
