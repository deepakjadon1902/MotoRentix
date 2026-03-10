import { Router } from "express";
import { createMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createMessage);

export default router;
