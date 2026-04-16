import Vehicle from "../models/Vehicle.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  res.json(
    vehicles.map((v) => {
      const obj = v.toObject();
      if ((!Array.isArray(obj.images) || obj.images.length === 0) && obj.image) {
        obj.images = [obj.image];
      }
      return obj;
    })
  );
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  const obj = vehicle.toObject();
  if ((!Array.isArray(obj.images) || obj.images.length === 0) && obj.image) {
    obj.images = [obj.image];
  }
  res.json(obj);
});
