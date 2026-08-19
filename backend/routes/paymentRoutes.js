import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createCustomerRentalPayment,
  platformRazorpayWebhook,
} from "../controllers/paymentController.js";

const router = Router();

router.post("/customer-rental", requireAuth, createCustomerRentalPayment);

router.post("/platform/razorpay/webhook", platformRazorpayWebhook);
router.post("/razorpay/webhook", platformRazorpayWebhook);

export default router;
