import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: { type: String, enum: ["open", "pending", "resolved", "closed"], default: "open" },
    replies: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

supportTicketSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export default mongoose.model("SupportTicket", supportTicketSchema);
