import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["bike", "scooter"], required: true },
    brand: { type: String, required: true },
    hourlyRate: { type: Number, required: true },
    dailyRate: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
