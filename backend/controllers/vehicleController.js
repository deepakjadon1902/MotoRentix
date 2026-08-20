import Vehicle from "../models/Vehicle.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { normalizeVehicleImages } from "../utils/assetPaths.js";

const mapPublicVehicle = async (vehicle, includePaymentMethods = false) => {
  const obj = normalizeVehicleImages(vehicle.toObject());

  if (includePaymentMethods) {
    obj.availablePaymentMethods = ["cash", "upi"];
  }

  return obj;
};

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ availability: true, status: { $nin: ["disabled", "archived"] } })
    .populate("branchId", "name city address status")
    .sort({ createdAt: -1 });

  res.json(await Promise.all(vehicles.map((vehicle) => mapPublicVehicle(vehicle))));
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate("branchId", "name city address status");

  if (!vehicle || ["disabled", "archived"].includes(vehicle.status)) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  res.json(await mapPublicVehicle(vehicle, true));
});
