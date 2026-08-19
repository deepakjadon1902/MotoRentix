import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    durationType: { type: String, enum: ["hour", "day", "week"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    pickupType: { type: String, enum: ["pickup", "drop"], default: "pickup" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "running", "completed", "cancelled", "rejected", "refunded", "overdue"],
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Booking", bookingSchema);
