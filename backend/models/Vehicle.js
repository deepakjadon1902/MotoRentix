import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    name: { type: String, required: true },
    bikeNumber: { type: String, trim: true },
    category: { type: String, enum: ["bike", "scooter", "electric_bike", "electric_scooter"], required: true },
    description: { type: String },
    features: { type: [String], default: [] },
    image: { type: String },
    images: { type: [String], default: [] },
    documents: {
      rcUrl: { type: String },
      insuranceUrl: { type: String },
      pollutionCertificateUrl: { type: String },
    },
    engineNumber: { type: String, trim: true },
    chassisNumber: { type: String, trim: true },
    pricePerHour: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    pricePerWeek: { type: Number, default: 0 },
    pricePerMonth: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    availability: { type: Boolean, default: true },
    status: { type: String, enum: ["available", "booked", "maintenance", "disabled", "archived"], default: "available" },
    gps: {
      enabled: { type: Boolean, default: false },
      deviceId: { type: String, trim: true },
    },
    maintenanceSchedule: {
      lastServiceDate: { type: Date },
      nextServiceDate: { type: Date },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ tenantId: 1, category: 1, availability: 1 });

export default mongoose.model("Vehicle", vehicleSchema);
