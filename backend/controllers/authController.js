import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Branch from "../models/Branch.js";
import Payment from "../models/Payment.js";
import PasswordResetOtp from "../models/PasswordResetOtp.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateToken } from "../utils/jwt.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { sendMail } from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const createOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth environment variables are not configured");
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

const encodeState = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const decodeState = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const generateResetToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ sub: user.id, purpose: "password_reset" }, secret, { expiresIn: "15m" });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dob, address, city, pincode, aadhaarNumber } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    dob,
    address,
    city,
    pincode,
    aadhaarNumber,
    role: "user",
    status: "active",
  });

  const token = generateToken(user);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      aadhaarNumber: user.aadhaarNumber,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
    },
  });
});

export const registerTenantOwner = asyncHandler(async (req, res) => {
  const {
    companyName,
    businessName,
    ownerName,
    email,
    phone,
    password,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    country,
    planCode = "starter",
    billingCycle = "monthly",
  } = req.body;

  if (!companyName || !ownerName || !email || !phone || !password) {
    return res.status(400).json({ message: "companyName, ownerName, email, phone, and password are required" });
  }
  if (!["monthly", "quarterly", "half_yearly", "yearly"].includes(billingCycle)) {
    return res.status(400).json({ message: "Invalid billing cycle" });
  }

  const normalizedEmail = email.toLowerCase();
  const [existingUser, existingTenant, plan] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    Tenant.findOne({ email: normalizedEmail }),
    SubscriptionPlan.findOne({ code: planCode, active: true }),
  ]);

  if (existingUser || existingTenant) {
    return res.status(409).json({ message: "A shop or user already exists with this email" });
  }
  if (!plan) {
    return res.status(404).json({ message: "Selected subscription plan was not found" });
  }

  const now = new Date();
  const endDate = new Date(now);
  if (billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (billingCycle === "half_yearly") {
    endDate.setMonth(endDate.getMonth() + 6);
  } else if (billingCycle === "quarterly") {
    endDate.setMonth(endDate.getMonth() + 3);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const tenant = await Tenant.create({
    companyName,
    businessName,
    ownerName,
    email: normalizedEmail,
    phone,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    country,
    planId: plan.id,
    status: "active",
  });

  const subscription = await Subscription.create({
    tenantId: tenant.id,
    planId: plan.id,
    billingCycle,
    purchaseDate: now,
    activationDate: now,
    startDate: now,
    endDate,
    renewalDate: endDate,
    gracePeriodDays: 7,
    graceEndsAt: new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    autoRenew: true,
    status: "active",
  });

  const amount = billingCycle === "yearly"
    ? plan.yearlyPrice
    : billingCycle === "half_yearly"
      ? Math.round(plan.monthlyPrice * 6)
      : billingCycle === "quarterly"
        ? Math.round(plan.monthlyPrice * 3)
        : plan.monthlyPrice;
  await Payment.create({
    tenantId: tenant.id,
    subscriptionId: subscription.id,
    paymentFor: "owner_subscription",
    provider: "manual",
    amount,
    currency: "INR",
    status: "paid",
    metadata: { planCode, billingCycle, bootstrap: true },
  });

  const branch = await Branch.create({
    tenantId: tenant.id,
    name: "Main Branch",
    phone,
    address,
    city,
    status: "active",
  });

  const user = await User.create({
    name: ownerName,
    email: normalizedEmail,
    password,
    phone,
    role: "owner",
    tenantId: tenant.id,
    branchId: branch.id,
    status: "active",
  });

  tenant.subscriptionId = subscription.id;
  await tenant.save();

  const token = generateToken(user);

  res.status(201).json({
    token,
    tenant,
    subscription,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: tenant.id,
      status: user.status,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user.status === "blocked") {
    return res.status(403).json({ message: "User is blocked" });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      aadhaarNumber: user.aadhaarNumber,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
    },
  });
});

export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(404).json({ message: "No account exists with this email" });
  }
  if (user.status === "blocked") {
    return res.status(403).json({ message: "This account is blocked" });
  }

  const recent = await PasswordResetOtp.findOne({
    email: normalizedEmail,
    consumed: false,
    createdAt: { $gte: new Date(Date.now() - 60_000) },
  });
  if (recent) {
    return res.status(429).json({ message: "Please wait one minute before requesting another OTP" });
  }

  await PasswordResetOtp.updateMany({ userId: user.id, consumed: false }, { consumed: true });

  const otp = String(crypto.randomInt(100000, 999999));
  await PasswordResetOtp.create({
    userId: user.id,
    email: normalizedEmail,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60_000),
  });

  const mailResult = await sendMail({
    to: normalizedEmail,
    subject: "Your MotoRentix password reset OTP",
    text: `Your MotoRentix password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2 style="color:#0b5ed7">MotoRentix password reset</h2>
        <p>Use this OTP to verify your password reset request:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f1f5f9;padding:16px;border-radius:12px;display:inline-block">${otp}</div>
        <p style="color:#5f6b7a">This OTP expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });

  res.json({
    message: "OTP sent to registered email",
    ...(mailResult?.skipped && process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
  });
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = await PasswordResetOtp.findOne({
    email: normalizedEmail,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    return res.status(400).json({ message: "OTP is invalid or expired" });
  }
  if (record.attempts >= 5) {
    record.consumed = true;
    await record.save();
    return res.status(429).json({ message: "Too many wrong attempts. Please request a new OTP." });
  }

  if (record.otpHash !== hashOtp(String(otp).trim())) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const user = await User.findById(record.userId);
  if (!user || user.status === "blocked") {
    return res.status(403).json({ message: "Account is not available" });
  }

  record.consumed = true;
  await record.save();

  const token = generateToken(user);
  const resetToken = generateResetToken(user);

  res.json({
    message: "OTP verified",
    token,
    resetToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      aadhaarNumber: user.aadhaarNumber,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
    },
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  const { email, name, emailVerified } = await verifyGoogleIdToken(credential);
  if (!emailVerified) {
    return res.status(403).json({ message: "Google account email is not verified" });
  }

  let user = await User.findOne({ email });
  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    user = await User.create({
      name,
      email,
      password: randomPassword,
      role: "user",
      status: "active",
    });
  }

  if (user.status === "blocked") {
    return res.status(403).json({ message: "User is blocked" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      aadhaarNumber: user.aadhaarNumber,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
    },
  });
});

export const googleOAuthStart = asyncHandler(async (req, res) => {
  const role = req.query.role === "admin" ? "admin" : "user";
  const fallbackNext = role === "admin" ? "/admin" : "/profile";
  const nextParam = typeof req.query.next === "string" ? req.query.next : fallbackNext;
  const next = nextParam.startsWith("/") ? nextParam : fallbackNext;

  const oauthClient = createOAuthClient();
  const state = encodeState({ role, next });
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account",
    state,
  });

  res.redirect(url);
});

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const decodedState = decodeState(state) || {};
  const role = decodedState.role === "admin" ? "admin" : "user";
  const fallbackNext = role === "admin" ? "/admin" : "/profile";
  const next = typeof decodedState.next === "string" && decodedState.next.startsWith("/")
    ? decodedState.next
    : fallbackNext;

  const frontendBase =
    process.env.FRONTEND_URL ||
    (process.env.FRONTEND_URLS || "")
      .split(",")
      .map((value) => value.trim())
      .find(Boolean) ||
    "http://localhost:8080";

  const redirectWithError = (message) => {
    const url = new URL("/auth/callback", frontendBase);
    url.searchParams.set("error", message);
    url.searchParams.set("role", role);
    url.searchParams.set("next", next);
    res.redirect(url.toString());
  };

  if (!code) {
    return redirectWithError("Missing authorization code");
  }

  let tokens;
  try {
    const oauthClient = createOAuthClient();
    const tokenResponse = await oauthClient.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (error) {
    return redirectWithError("Failed to exchange authorization code");
  }

  if (!tokens?.id_token) {
    return redirectWithError("Missing Google ID token");
  }

  let googleProfile;
  try {
    googleProfile = await verifyGoogleIdToken(tokens.id_token);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Google token verification failed";
    const message = raw.includes("Token used too late")
      ? "Google token expired because server time is incorrect. Please enable automatic time sync and retry."
      : `Google token verification failed: ${raw}`;
    return redirectWithError(message);
  }

  if (!googleProfile.emailVerified) {
    return redirectWithError("Google account email is not verified");
  }

  let user = await User.findOne({ email: googleProfile.email });
  if (role === "admin") {
    if (!user || user.role !== "admin") {
      return redirectWithError("Admin account not found");
    }
  } else if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    user = await User.create({
      name: googleProfile.name,
      email: googleProfile.email,
      password: randomPassword,
      role: "user",
      status: "active",
    });
  }

  if (!user) {
    return redirectWithError("User not found");
  }
  if (user.status === "blocked") {
    return redirectWithError(role === "admin" ? "Admin is blocked" : "User is blocked");
  }

  const token = generateToken(user);
  const url = new URL("/auth/callback", frontendBase);
  url.searchParams.set("token", token);
  url.searchParams.set("role", role);
  url.searchParams.set("next", next);
  res.redirect(url.toString());
});
