import express, { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createCustomerRentalPayment,
  platformRazorpayWebhook,
  tenantPayUWebhook,
  tenantRazorpayWebhook,
  tenantStripeWebhook,
  tenantUpiWebhook,
} from "../controllers/paymentController.js";

const router = Router();

const captureRawBody = (req, res, buf) => {
  req.rawBody = buf.toString("utf8");
};

router.post("/customer-rental", requireAuth, createCustomerRentalPayment);

router.post("/platform/razorpay/webhook", platformRazorpayWebhook);
router.post("/razorpay/webhook", platformRazorpayWebhook);

router.post("/tenants/:tenantId/razorpay/webhook", tenantRazorpayWebhook);
router.post("/tenants/:tenantId/stripe/webhook", tenantStripeWebhook);
router.post(
  "/tenants/:tenantId/payu/webhook",
  express.urlencoded({ extended: false, verify: captureRawBody }),
  tenantPayUWebhook
);
router.post("/tenants/:tenantId/upi/webhook", tenantUpiWebhook);

export default router;
