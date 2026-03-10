import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { generateToken } from "../utils/jwt.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.role !== "admin") {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user.status === "blocked") {
    return res.status(403).json({ message: "Admin is blocked" });
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
      role: user.role,
      status: user.status,
    },
  });
});

export const addVehicle = asyncHandler(async (req, res) => {
  const { name, category, description, pricePerHour, pricePerDay, availability } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  if (!name || !category || pricePerHour == null || pricePerDay == null) {
    return res.status(400).json({ message: "Name, category, pricePerHour, and pricePerDay are required" });
  }

  const vehicle = await Vehicle.create({
    name,
    category,
    description,
    image,
    pricePerHour,
    pricePerDay,
    availability,
  });

  res.status(201).json(vehicle);
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  if (req.file) {
    vehicle.image = `/uploads/${req.file.filename}`;
  }
  Object.assign(vehicle, req.body);
  await vehicle.save();

  res.json(vehicle);
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  await vehicle.deleteOne();
  res.json({ message: "Vehicle deleted" });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.status = status;
  await user.save();
  res.json({ message: "Status updated", user: { id: user.id, status: user.status } });
});

export const listBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("userId", "name email")
    .populate("vehicleId", "name category")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export const analytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalBookings, totalVehicles, activeUsers] = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments(),
    Vehicle.countDocuments(),
    User.countDocuments({ status: "active" }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const revenueAgg = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: monthStart, $lt: monthEnd },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);

  const monthlyRevenue = revenueAgg[0]?.total || 0;

  res.json({ totalUsers, totalBookings, totalVehicles, activeUsers, monthlyRevenue });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(messages);
});

export const replyMessage = asyncHandler(async (req, res) => {
  const { messageId, adminReply } = req.body;
  if (!messageId || !adminReply) {
    return res.status(400).json({ message: "messageId and adminReply are required" });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  message.adminReply = adminReply;
  await message.save();

  res.json({ message: "Reply sent", data: message });
});
