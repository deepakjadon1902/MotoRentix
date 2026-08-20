import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import Tenant from "../models/Tenant.js";
import TenantSettings from "../models/TenantSettings.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { sendMail } from "../utils/mail.js";
import { activateSubscriptionLifecycle } from "../utils/subscriptionLifecycle.js";
import { verifyGenericWebhookHmac, verifyPayUHash, verifyRazorpayWebhook } from "../utils/razorpay.js";
import crypto from "crypto";
import QRCode from "qrcode";

const getTenantSettings = async (tenantId) => {
  const settings = await TenantSettings.findOne({ tenantId });
  if (!settings) {
    const error = new Error("Tenant payment settings are not configured");
    error.statusCode = 400;
    throw error;
  }
  return settings;
};

const providerSettingsKey = (provider) => provider === "bank_transfer" ? "bankTransfer" : provider;

const platformPaymentSettings = () => ({
  razorpay: {
    enabled: Boolean(
      (process.env.RAZORPAY_PLATFORM_KEY_ID || process.env.RAZORPAY_KEY_ID) &&
      (process.env.RAZORPAY_PLATFORM_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET)
    ),
    keyId: process.env.RAZORPAY_PLATFORM_KEY_ID || process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_PLATFORM_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
  },
  payu: {
    enabled: Boolean(
      (process.env.PAYU_PLATFORM_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY) &&
      (process.env.PAYU_PLATFORM_SALT || process.env.PAYU_SALT)
    ),
    merchantKey: process.env.PAYU_PLATFORM_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY,
    salt: process.env.PAYU_PLATFORM_SALT || process.env.PAYU_SALT,
  },
  stripe: {
    enabled: Boolean(process.env.STRIPE_PLATFORM_SECRET_KEY || process.env.STRIPE_SECRET_KEY),
    secretKey: process.env.STRIPE_PLATFORM_SECRET_KEY || process.env.STRIPE_SECRET_KEY,
  },
  upi: {
    enabled: true,
    upiId: process.env.MOTORENTIX_UPI_ID || process.env.PLATFORM_UPI_ID || process.env.UPI_ID,
    displayName: process.env.MOTORENTIX_UPI_NAME || process.env.PLATFORM_UPI_NAME || "MotoRentix",
  },
  cash: { enabled: true },
  bankTransfer: { enabled: true },
});

const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:8080").replace(/\/$/, "");

const apiUrl = (req) => {
  const configured = process.env.API_PUBLIC_URL || process.env.BACKEND_URL;
  if (configured) return configured.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
};

const buildUpiIntentUrl = ({ upiId, displayName, amount, note }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: displayName || "MotoRentix Rental",
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
};

const payuHash = ({ key, txnid, amount, productinfo, firstname, email, udf1, salt }) => {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

const verifyStripeSignature = ({ rawBody, signature, secret }) => {
  if (!secret || !signature || !rawBody) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parts.v1);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

const verifyRazorpayPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

const definedClauses = (clauses) => clauses.filter((clause) => {
  const value = Object.values(clause)[0];
  return value !== undefined && value !== null && value !== "";
});

const sendBookingPaymentMail = async ({ booking, payment, status }) => {
  const populated = await Booking.findById(booking.id || booking._id)
    .populate("tenantId", "companyName email phone")
    .populate("userId", "name email phone")
    .populate("vehicleId", "name bikeNumber category");

  if (!populated?.userId?.email) return;

  const ok = status === "paid";
  const subject = ok
    ? `Payment successful - Booking confirmed for ${populated.vehicleId?.name || "your vehicle"}`
    : `Payment failed - Booking not confirmed for ${populated.vehicleId?.name || "your vehicle"}`;
  const details = `
Booking ID: ${populated.id}
Company: ${populated.tenantId?.companyName || "-"}
Vehicle: ${populated.vehicleId?.name || "-"} ${populated.vehicleId?.bikeNumber ? `(${populated.vehicleId.bikeNumber})` : ""}
Duration: ${populated.durationType}
Start: ${new Date(populated.startDate).toLocaleString("en-IN")}
End: ${new Date(populated.endDate).toLocaleString("en-IN")}
Amount: INR ${payment.amount}
Payment Status: ${payment.status}
Booking Status: ${populated.status}
`;

  await sendMail({
    to: populated.userId.email,
    subject,
    text: `${ok ? "Your payment was successful and booking is confirmed." : "Your payment failed and booking is not confirmed."}\n\n${details}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2 style="color:${ok ? "#16a34a" : "#dc2626"}">${ok ? "Payment successful" : "Payment failed"}</h2>
        <p>${ok ? "Your booking has been confirmed automatically." : "Your booking could not be confirmed because payment failed."}</p>
        <table style="border-collapse:collapse;width:100%;max-width:620px">
          ${[
            ["Booking ID", populated.id],
            ["Company", populated.tenantId?.companyName || "-"],
            ["Vehicle", populated.vehicleId?.name || "-"],
            ["Duration", populated.durationType],
            ["Start", new Date(populated.startDate).toLocaleString("en-IN")],
            ["End", new Date(populated.endDate).toLocaleString("en-IN")],
            ["Amount", `INR ${payment.amount}`],
            ["Payment Status", payment.status],
            ["Booking Status", populated.status],
          ].map(([label, value]) => `<tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">${label}</td><td style="padding:8px;border:1px solid #e2e8f0">${value}</td></tr>`).join("")}
        </table>
      </div>
    `,
  });
};

const applyRentalPaymentStatus = async ({ payment, status, providerPaymentId, metadata }) => {
  if (!payment) return null;

  payment.status = status;
  if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
  payment.metadata = { ...(payment.metadata || {}), webhook: metadata };
  await payment.save();

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) return payment;

  booking.paymentStatus = status;
  if (status === "paid") {
    booking.status = "confirmed";
    await Vehicle.findByIdAndUpdate(booking.vehicleId, { availability: false, status: "booked" });
  } else if (status === "failed") {
    booking.paymentStatus = "failed";
  }
  await booking.save();

  try {
    await sendBookingPaymentMail({ booking, payment, status });
  } catch (error) {
    console.warn("Payment email delivery failed:", error.message);
  }

  return payment;
};

export const createCustomerRentalPayment = asyncHandler(async (req, res) => {
  const { bookingId, provider = "razorpay", payerUpiId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }
  if (!["razorpay", "payu", "stripe", "upi", "cash", "bank_transfer"].includes(provider)) {
    return res.status(400).json({ message: "Unsupported payment provider" });
  }

  const booking = await Booking.findOne({ _id: bookingId, userId: req.user.id });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.paymentStatus === "paid") {
    return res.status(409).json({ message: "Booking is already paid" });
  }

  if (!booking.tenantId && booking.vehicleId) {
    const bookedVehicle = await Vehicle.findById(booking.vehicleId).select("tenantId");
    if (bookedVehicle?.tenantId) {
      booking.tenantId = bookedVehicle.tenantId;
      await booking.save();
    }
  }

  const [tenant, user, vehicle] = await Promise.all([
    Tenant.findById(booking.tenantId).select("companyName phone"),
    User.findById(req.user.id).select("name email phone"),
    Vehicle.findById(booking.vehicleId).select("name bikeNumber category"),
  ]);

  const providerSettings = platformPaymentSettings()[providerSettingsKey(provider)];
  if (!providerSettings?.enabled) {
    return res.status(400).json({ message: `${provider} is not configured by MotoRentix admin` });
  }

  const payment = await Payment.create({
    tenantId: booking.tenantId,
    bookingId: booking.id,
    paymentFor: "customer_rental",
    provider,
    amount: booking.totalPrice,
    currency: "INR",
    status: "pending",
    metadata: { source: "customer_checkout", ...(payerUpiId ? { payerUpiId } : {}) },
  });

  if (provider === "razorpay") {
    if (!providerSettings.keyId || !providerSettings.keySecret) {
      return res.status(400).json({ message: "Razorpay keys are not configured by this rental company" });
    }
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${providerSettings.keyId}:${providerSettings.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(booking.totalPrice * 100),
        currency: "INR",
        receipt: `booking_${booking.id}`,
        notes: {
          paymentId: payment.id,
          bookingId: booking.id,
          tenantId: String(booking.tenantId),
        },
      }),
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok) {
      payment.status = "failed";
      payment.metadata = { ...payment.metadata, orderError: order };
      await payment.save();
      return res.status(400).json({ message: order?.error?.description || "Failed to create Razorpay order" });
    }
    payment.providerOrderId = order.id;
    payment.metadata = { ...payment.metadata, order };
    await payment.save();
    return res.status(201).json({
      payment,
      checkout: {
        provider: "razorpay",
        keyId: providerSettings.keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        displayName: tenant?.companyName || "MotoRentix Rental",
      },
    });
  }

  if (provider === "stripe") {
    if (!providerSettings.secretKey) {
      return res.status(400).json({ message: "Stripe secret key is not configured by this rental company" });
    }
    const successUrl = `${frontendUrl()}/booking-status/${booking.id}?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl()}/booking-status/${booking.id}?provider=stripe&payment=cancelled`;
    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "customer_email": user?.email || "",
      "client_reference_id": payment.id,
      "metadata[paymentId]": payment.id,
      "metadata[bookingId]": booking.id,
      "metadata[tenantId]": String(booking.tenantId),
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "inr",
      "line_items[0][price_data][unit_amount]": String(Math.round(booking.totalPrice * 100)),
      "line_items[0][price_data][product_data][name]": vehicle?.name || "MotoRentix rental booking",
      "line_items[0][price_data][product_data][description]": `Booking ${booking.id}`,
    });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerSettings.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok) {
      payment.status = "failed";
      payment.metadata = { ...payment.metadata, sessionError: session };
      await payment.save();
      return res.status(400).json({ message: session?.error?.message || "Failed to create Stripe checkout session" });
    }
    payment.providerOrderId = session.id;
    payment.metadata = { ...payment.metadata, checkoutSession: session };
    await payment.save();
    return res.status(201).json({
      payment,
      checkout: {
        provider: "stripe",
        redirectUrl: session.url,
        sessionId: session.id,
        amount: booking.totalPrice,
        currency: "INR",
      },
    });
  }

  if (provider === "payu") {
    if (!providerSettings.merchantKey || !providerSettings.salt) {
      return res.status(400).json({ message: "PayU merchant key and salt are not configured by this rental company" });
    }
    const txnid = `MRX${payment.id.slice(-16)}`.replace(/[^a-zA-Z0-9]/g, "");
    const amount = Number(booking.totalPrice).toFixed(2);
    const productinfo = vehicle?.name || "MotoRentix rental booking";
    const firstname = user?.name || "MotoRentix Customer";
    const email = user?.email || "customer@motorentix.local";
    const phone = user?.phone || tenant?.phone || "9999999999";
    const surl = `${apiUrl(req)}/api/payments/tenants/${booking.tenantId}/payu/webhook`;
    const furl = surl;
    const fields = {
      key: providerSettings.merchantKey,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      udf1: payment.id,
      hash: payuHash({ key: providerSettings.merchantKey, txnid, amount, productinfo, firstname, email, udf1: payment.id, salt: providerSettings.salt }),
    };
    payment.providerOrderId = txnid;
    payment.metadata = { ...payment.metadata, payu: { txnid, productinfo } };
    await payment.save();
    return res.status(201).json({
      payment,
      checkout: {
        provider: "payu",
        amount: booking.totalPrice,
        currency: "INR",
        form: {
          action: process.env.PAYU_PAYMENT_URL || "https://secure.payu.in/_payment",
          method: "POST",
          fields,
        },
      },
    });
  }

  if (provider === "upi") {
    const note = `MotoRentix booking ${booking.id}`;
    if (!providerSettings.upiId) {
      payment.metadata = { ...payment.metadata, note };
      await payment.save();
      return res.status(201).json({
        payment,
        checkout: {
          provider: "upi",
          displayName: providerSettings.displayName || "MotoRentix",
          amount: booking.totalPrice,
          currency: "INR",
          note: `MotoRentix admin will confirm payment for booking ${booking.id}`,
        },
      });
    }
    const upiIntentUrl = buildUpiIntentUrl({
      upiId: providerSettings.upiId,
      displayName: providerSettings.displayName || tenant?.companyName,
      amount: booking.totalPrice,
      note,
    });
    const qrDataUrl = await QRCode.toDataURL(upiIntentUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    payment.metadata = { ...payment.metadata, upiIntentUrl, upiId: providerSettings.upiId, note };
    await payment.save();
    return res.status(201).json({
      payment,
      checkout: {
        provider: "upi",
        upiId: providerSettings.upiId,
        displayName: providerSettings.displayName || tenant?.companyName,
        amount: booking.totalPrice,
        currency: "INR",
        qrDataUrl,
        upiIntentUrl,
        note,
      },
    });
  }

  return res.status(201).json({ payment, checkout: { provider, amount: booking.totalPrice } });
});

export const verifyCustomerRentalRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    paymentId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return res.status(400).json({ message: "Razorpay payment verification details are required" });
  }

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.paymentFor !== "customer_rental" || payment.provider !== "razorpay") {
    return res.status(404).json({ message: "Razorpay payment record not found" });
  }

  const booking = await Booking.findOne({ _id: payment.bookingId, userId: req.user.id });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found for this payment" });
  }

  if (payment.status === "paid" && booking.paymentStatus === "paid") {
    return res.json({ payment, booking });
  }

  if (payment.providerOrderId !== razorpayOrderId) {
    return res.status(400).json({ message: "Razorpay order mismatch" });
  }

  const providerSettings = platformPaymentSettings().razorpay;
  const valid = verifyRazorpayPaymentSignature({
    orderId: payment.providerOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    secret: providerSettings.keySecret,
  });

  if (!valid) {
    payment.status = "failed";
    payment.metadata = {
      ...(payment.metadata || {}),
      razorpayVerification: { razorpayOrderId, razorpayPaymentId, valid: false },
    };
    await payment.save();
    return res.status(400).json({ message: "Invalid Razorpay payment signature" });
  }

  const updatedPayment = await applyRentalPaymentStatus({
    payment,
    status: "paid",
    providerPaymentId: razorpayPaymentId,
    metadata: {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      verifiedAt: new Date().toISOString(),
      source: "checkout_handler",
    },
  });

  const updatedBooking = await Booking.findById(booking.id);
  res.json({ payment: updatedPayment, booking: updatedBooking });
});

export const platformRazorpayWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers["x-razorpay-signature"];
  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return res.status(400).json({ message: "Invalid platform Razorpay signature" });
  }

  const event = req.body;
  const paymentEntity = event?.payload?.payment?.entity || {};
  const paymentId = paymentEntity.id;
  const orderId = paymentEntity.order_id;
  const internalPaymentId = paymentEntity.notes?.paymentId;
  const status = event?.event === "payment.captured" ? "paid" : event?.event === "payment.failed" ? "failed" : null;
  const subscriptionId = paymentEntity.notes?.subscriptionId;

  if (paymentId && status) {
    await Payment.findOneAndUpdate({ providerPaymentId: paymentId }, { status, metadata: event }, { upsert: false });
  }

  if (paymentId && status) {
    const rentalClauses = definedClauses([
      { providerPaymentId: paymentId },
      { providerOrderId: orderId },
      { _id: internalPaymentId },
    ]);
    const payment = rentalClauses.length
      ? await Payment.findOne({ paymentFor: "customer_rental", provider: "razorpay", $or: rentalClauses })
      : null;
    if (payment) {
      await applyRentalPaymentStatus({
        payment,
        status,
        providerPaymentId: paymentId,
        metadata: event,
      });
    }
  }

  if (subscriptionId && status === "paid") {
    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { paymentStatus: "paid", status: "active" },
      { new: true }
    ).populate("planId");
    if (subscription) {
      const payment = await Payment.findOne({ providerPaymentId: paymentId, paymentFor: "owner_subscription" });
      await Tenant.findByIdAndUpdate(subscription.tenantId, { status: "active", subscriptionId: subscription.id });
      await activateSubscriptionLifecycle({
        subscription,
        plan: subscription.planId,
        payment,
        source: "platform_payment_webhook",
      });
    }
  }

  res.json({ received: true });
});

export const tenantRazorpayWebhook = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const settings = await getTenantSettings(tenantId);
  const secret = settings.paymentMethods?.razorpay?.webhookSecret;
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers["x-razorpay-signature"];
  if (!verifyRazorpayWebhook(rawBody, signature, secret)) {
    return res.status(400).json({ message: "Invalid tenant Razorpay signature" });
  }

  const entity = req.body?.payload?.payment?.entity || {};
  const status = req.body?.event === "payment.captured" ? "paid" : req.body?.event === "payment.failed" ? "failed" : null;
  if (!status) return res.json({ received: true, ignored: true });

  const clauses = definedClauses([
      { _id: entity.notes?.paymentId },
      { providerOrderId: entity.order_id },
      { providerPaymentId: entity.id },
  ]);
  const payment = clauses.length
    ? await Payment.findOne({ tenantId, paymentFor: "customer_rental", $or: clauses })
    : null;

  await applyRentalPaymentStatus({ payment, status, providerPaymentId: entity.id, metadata: req.body });
  res.json({ received: true });
});

export const tenantPayUWebhook = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const settings = await getTenantSettings(tenantId);
  const salt = settings.paymentMethods?.payu?.salt;
  if (!verifyPayUHash({ body: req.body, salt })) {
    return res.status(400).json({ message: "Invalid PayU hash" });
  }

  const status = req.body.status === "success" ? "paid" : "failed";
  const clauses = definedClauses([
      { _id: req.body.udf1 },
      { providerPaymentId: req.body.mihpayid },
      { providerOrderId: req.body.txnid },
  ]);
  const payment = clauses.length
    ? await Payment.findOne({ tenantId, paymentFor: "customer_rental", $or: clauses })
    : null;

  await applyRentalPaymentStatus({ payment, status, providerPaymentId: req.body.mihpayid, metadata: req.body });
  res.json({ received: true });
});

export const tenantStripeWebhook = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const settings = await getTenantSettings(tenantId);
  const secret = settings.paymentMethods?.stripe?.webhookSecret;
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers["stripe-signature"];
  if (secret && !verifyStripeSignature({ rawBody, signature, secret })) {
    return res.status(400).json({ message: "Invalid Stripe signature" });
  }

  const event = req.body;
  if (event?.type !== "checkout.session.completed" && event?.type !== "payment_intent.payment_failed") {
    return res.json({ received: true, ignored: true });
  }

  const session = event?.data?.object || {};
  const status = event.type === "checkout.session.completed" && session.payment_status === "paid" ? "paid" : "failed";
  const clauses = definedClauses([
      { _id: session.metadata?.paymentId },
      { providerOrderId: session.id },
      { providerPaymentId: session.payment_intent },
  ]);
  const payment = clauses.length
    ? await Payment.findOne({ tenantId, paymentFor: "customer_rental", $or: clauses })
    : null;

  await applyRentalPaymentStatus({ payment, status, providerPaymentId: session.payment_intent, metadata: event });
  res.json({ received: true });
});

export const tenantUpiWebhook = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const settings = await getTenantSettings(tenantId);
  const secret = settings.paymentMethods?.upi?.webhookSecret;
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers["x-upi-signature"] || req.headers["x-webhook-signature"];
  if (secret && !verifyGenericWebhookHmac({ rawBody, signature, secret })) {
    return res.status(400).json({ message: "Invalid UPI webhook signature" });
  }

  const status = ["paid", "success", "captured"].includes(String(req.body.status).toLowerCase()) ? "paid" : "failed";
  const clauses = definedClauses([
      { _id: req.body.paymentId },
      { providerPaymentId: req.body.providerPaymentId },
      { providerOrderId: req.body.providerOrderId },
  ]);
  const payment = clauses.length
    ? await Payment.findOne({ tenantId, paymentFor: "customer_rental", $or: clauses })
    : null;

  await applyRentalPaymentStatus({ payment, status, providerPaymentId: req.body.providerPaymentId, metadata: req.body });
  res.json({ received: true });
});
