import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  googleOAuthStart,
  googleOAuthCallback,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/google", googleOAuthStart);
router.get("/google/callback", googleOAuthCallback);

export default router;
