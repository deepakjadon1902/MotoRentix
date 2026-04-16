import Message from "../models/Message.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const createMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const created = await Message.create({
    userId: req.user.id,
    message,
  });

  res.status(201).json(created);
});

export const listUserMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ userId: req.user.id })
    .sort({ createdAt: -1 });
  res.json(messages);
});
