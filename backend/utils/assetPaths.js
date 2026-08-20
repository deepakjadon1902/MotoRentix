const parseMaybeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [trimmed];
};

export const normalizeStoredAssetPath = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return "";

  try {
    const url = new URL(trimmed);
    const uploadIndex = url.pathname.indexOf("/uploads/");
    if (uploadIndex >= 0) {
      return url.pathname.slice(uploadIndex);
    }
    return trimmed;
  } catch {
    const uploadIndex = trimmed.indexOf("/uploads/");
    if (uploadIndex >= 0) {
      return trimmed.slice(uploadIndex);
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
};

export const normalizeStoredAssetList = (value) => {
  const flat = parseMaybeArray(value).flatMap((item) => parseMaybeArray(item));
  return [...new Set(flat.map(normalizeStoredAssetPath).filter(Boolean))];
};

export const normalizeVehicleImages = (vehicleLike) => {
  const images = normalizeStoredAssetList(vehicleLike.images);
  const image = normalizeStoredAssetPath(vehicleLike.image);
  const normalizedImages = images.length > 0 ? images : image ? [image] : [];
  vehicleLike.images = normalizedImages;
  vehicleLike.image = normalizedImages[0] || "";
  return vehicleLike;
};
