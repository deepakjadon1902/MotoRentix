import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    adminReply: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
