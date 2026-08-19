import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

passwordResetOtpSchema.index({ email: 1, consumed: 1, createdAt: -1 });

export default mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
