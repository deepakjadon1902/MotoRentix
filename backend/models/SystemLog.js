import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], default: "info", index: true },
    source: { type: String, required: true },
    message: { type: String, required: true },
    requestId: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

systemLogSchema.index({ createdAt: -1 });

export default mongoose.model("SystemLog", systemLogSchema);
