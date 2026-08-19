import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    audience: { type: String, enum: ["tenant", "customer", "staff", "all_clients", "all_users"], default: "tenant" },
    channel: { type: String, enum: ["in_app", "email", "sms", "whatsapp", "push"], default: "in_app" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["draft", "scheduled", "sent", "failed", "read"], default: "sent" },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    metadata: { type: Object },
  },
  { timestamps: true }
);

notificationSchema.index({ tenantId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });

export default mongoose.model("Notification", notificationSchema);
