import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    system: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.model("Role", roleSchema);
