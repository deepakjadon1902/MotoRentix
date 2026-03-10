import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ["bike", "scooter"], required: true },
    description: { type: String },
    image: { type: String },
    pricePerHour: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    availability: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
