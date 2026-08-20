import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { sendMail } from "../utils/mail.js";

const calculateTotal = ({ durationType, startDate, endDate, vehicle }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  if (durationType === "day") {
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days * vehicle.pricePerDay;
  }
  if (durationType === "week") {
    const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
    return weeks * (vehicle.pricePerWeek || vehicle.pricePerDay * 7);
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

  if (!["hour", "day", "week"].includes(durationType)) {
    return res.status(400).json({ message: "Invalid durationType" });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  if (!vehicle.availability || ["disabled", "archived"].includes(vehicle.status)) {
    return res.status(400).json({ message: "Vehicle is not available" });
  }

  const totalPrice = calculateTotal({ durationType, startDate, endDate, vehicle });
  if (!totalPrice) {
    return res.status(400).json({ message: "Invalid booking dates" });
  }

  const booking = await Booking.create({
    tenantId: vehicle.tenantId,
    userId: req.user.id,
    vehicleId: vehicle.id,
    durationType,
    startDate,
    endDate,
    totalPrice,
    status: "pending",
  });

  try {
    await sendMail({
      to: req.user.email,
      subject: `Booking request received - ${vehicle.name}`,
      text: `Your booking request has been received.\n\nBooking ID: ${booking.id}\nVehicle: ${vehicle.name}\nDuration: ${durationType}\nStart: ${new Date(startDate).toLocaleString("en-IN")}\nEnd: ${new Date(endDate).toLocaleString("en-IN")}\nAmount: INR ${totalPrice}\nPayment Status: pending\nBooking Status: pending`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2 style="color:#0b5ed7">Booking request received</h2>
          <p>Your booking has been created. Complete payment to confirm it automatically.</p>
          <table style="border-collapse:collapse;width:100%;max-width:620px">
            ${[
              ["Booking ID", booking.id],
              ["Vehicle", vehicle.name],
              ["Duration", durationType],
              ["Start", new Date(startDate).toLocaleString("en-IN")],
              ["End", new Date(endDate).toLocaleString("en-IN")],
              ["Amount", `INR ${totalPrice}`],
              ["Payment Status", "pending"],
              ["Booking Status", "pending"],
            ].map(([label, value]) => `<tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">${label}</td><td style="padding:8px;border:1px solid #e2e8f0">${value}</td></tr>`).join("")}
          </table>
        </div>
      `,
    });
  } catch (error) {
    console.warn("Booking email delivery failed:", error.message);
  }

  res.status(201).json(booking);
});

export const listUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id })
    .populate("vehicleId", "name category image images pricePerHour pricePerDay pricePerWeek")
    .sort({ createdAt: -1 });
  res.json(bookings);
});
