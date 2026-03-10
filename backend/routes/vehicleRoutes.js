import { Router } from "express";
import { listVehicles, getVehicleById } from "../controllers/vehicleController.js";

const router = Router();

router.get("/", listVehicles);
router.get("/:id", getVehicleById);

export default router;
