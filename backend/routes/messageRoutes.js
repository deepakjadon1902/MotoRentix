import { Router } from "express";
import { createMessage, listUserMessages } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createMessage);
router.get("/", requireAuth, listUserMessages);

export default router;
