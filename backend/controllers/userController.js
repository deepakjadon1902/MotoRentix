import Booking from "../models/Booking.js";
import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id })
    .populate("vehicleId", "name category image pricePerHour pricePerDay")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, dob, address, city, pincode, aadhaarNumber } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof name === "string") user.name = name.trim() || user.name;
  if (typeof phone === "string") user.phone = phone;
  if (typeof dob === "string") user.dob = dob;
  if (typeof address === "string") user.address = address;
  if (typeof city === "string") user.city = city;
  if (typeof pincode === "string") user.pincode = pincode;
  if (typeof aadhaarNumber === "string") user.aadhaarNumber = aadhaarNumber;

  await user.save();

  res.json({
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
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, resetToken } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let authorizedByReset = false;
  if (resetToken) {
    try {
      const payload = jwt.verify(resetToken, process.env.JWT_SECRET);
      authorizedByReset = payload?.purpose === "password_reset" && payload?.sub === user.id;
    } catch {
      return res.status(401).json({ message: "Password reset session expired. Please verify OTP again." });
    }
  }

  if (!authorizedByReset) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});
