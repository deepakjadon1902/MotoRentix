import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import asyncHandler from "../middleware/asyncHandler.js";

const calculateTotal = ({ durationType, startDate, endDate, vehicle }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  if (durationType === "day") {
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days * vehicle.pricePerDay;
  }
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  return hours * vehicle.pricePerHour;
};

export const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, durationType, startDate, endDate } = req.body;
  if (!vehicleId || !durationType || !startDate || !endDate) {
    return res.status(400).json({ message: "vehicleId, durationType, startDate, endDate are required" });
  }

  const requiredProfileFields = ["phone", "address", "city", "pincode", "aadhaarNumber"];
  const missing = requiredProfileFields.filter((key) => !req.user?.[key]);
  if (missing.length > 0) {
    return res.status(400).json({ message: "Please complete your profile (phone, address, city, pincode, Aadhaar) before booking." });
  }

  if (!["hour", "day"].includes(durationType)) {
    return res.status(400).json({ message: "Invalid durationType" });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  if (!vehicle.availability) {
    return res.status(400).json({ message: "Vehicle is not available" });
  }

  const totalPrice = calculateTotal({ durationType, startDate, endDate, vehicle });
  if (!totalPrice) {
    return res.status(400).json({ message: "Invalid booking dates" });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    vehicleId: vehicle.id,
    durationType,
    startDate,
    endDate,
    totalPrice,
    status: "pending",
  });

  res.status(201).json(booking);
});

export const listUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id })
    .populate("vehicleId", "name category image images pricePerHour pricePerDay")
    .sort({ createdAt: -1 });
  res.json(bookings);
});
