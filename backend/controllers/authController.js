import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateToken } from "../utils/jwt.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import crypto from "crypto";
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
