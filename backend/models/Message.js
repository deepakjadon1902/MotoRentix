import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sentByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    direction: { type: String, enum: ["user_to_admin", "admin_to_user"], default: "user_to_admin" },
    audience: { type: String, enum: ["selected", "users", "clients", "collective"], default: "selected" },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    adminReply: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
