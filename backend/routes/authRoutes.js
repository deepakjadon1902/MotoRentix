import { Router } from "express";
import {
  register,
  login,
  requestPasswordResetOtp,
  googleLogin,
  googleOAuthStart,
  googleOAuthCallback,
  verifyPasswordResetOtp,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordResetOtp);
router.post("/verify-reset-otp", verifyPasswordResetOtp);
router.post("/google", googleLogin);
router.get("/google", googleOAuthStart);
router.get("/google/callback", googleOAuthCallback);

export default router;
