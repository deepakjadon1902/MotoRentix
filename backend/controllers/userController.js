import Booking from "../models/Booking.js";
import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";

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
