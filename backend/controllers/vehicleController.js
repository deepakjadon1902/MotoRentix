import Vehicle from "../models/Vehicle.js";
import TenantSettings from "../models/TenantSettings.js";
import asyncHandler from "../middleware/asyncHandler.js";

const mapPublicVehicle = async (vehicle, includePaymentMethods = false) => {
  const obj = vehicle.toObject();
  if ((!Array.isArray(obj.images) || obj.images.length === 0) && obj.image) {
    obj.images = [obj.image];
  }

  if (includePaymentMethods && obj.tenantId?._id) {
    const settings = await TenantSettings.findOne({ tenantId: obj.tenantId._id }).select("paymentMethods");
    obj.availablePaymentMethods = Object.entries(settings?.paymentMethods?.toObject?.() || settings?.paymentMethods || {})
      .filter(([, value]) => value?.enabled)
      .map(([key]) => key === "bankTransfer" ? "bank_transfer" : key);
  }

  return obj;
};

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ availability: true, status: { $ne: "disabled" } })
    .populate("tenantId", "companyName ownerName phone status branding")
    .populate("branchId", "name city address status")
    .sort({ createdAt: -1 });

  const activeVehicles = vehicles.filter((vehicle) => ["trial", "active", "renewal_due"].includes(vehicle.tenantId?.status));
  res.json(await Promise.all(activeVehicles.map((vehicle) => mapPublicVehicle(vehicle))));
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate("tenantId", "companyName ownerName email phone status branding")
    .populate("branchId", "name city address status");

  if (!vehicle || !["trial", "active", "renewal_due"].includes(vehicle.tenantId?.status)) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  res.json(await mapPublicVehicle(vehicle, true));
});
