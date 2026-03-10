import Booking from "../models/Booking.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id })
    .populate("vehicleId", "name category image pricePerHour pricePerDay")
    .sort({ createdAt: -1 });
  res.json(bookings);
});
