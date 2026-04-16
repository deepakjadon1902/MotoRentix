import type { Vehicle } from "@/lib/types";
import type { Vehicle } from "@/lib/types";
import { API_BASE_URL } from "@/lib/apiBase";
import { resolveApiAssetUrl } from "@/lib/assetUrl";

type VehicleDto = {
  _id?: string;
  id?: string;
  name?: string;
  category?: "bike" | "scooter";
  description?: string;
  image?: string;
  images?: string[];
  pricePerHour?: number;
  pricePerDay?: number;
  availability?: boolean;
};

export type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: "user" | "admin";
  status?: "active" | "blocked";
  createdAt?: string;
};

export type AdminBooking = {
  _id?: string;
  id?: string;
  userId?: { name?: string; email?: string };
  vehicleId?: { name?: string; category?: string };
  durationType?: "hour" | "day";
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: "pending" | "confirmed" | "completed";
  createdAt?: string;
};

export type AdminMessage = {
  _id?: string;
  id?: string;
  userId?: { _id?: string; id?: string; name?: string; email?: string };
  message?: string;
  adminReply?: string;
  createdAt?: string;
};

const parseJson = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const request = async <T>(path: string, token: string, options: RequestInit = {}): Promise<T> => {
  const isJsonBody = typeof options.body === "string";
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : "Request failed";
    throw new Error(message);
  }
  return data as T;
};

const mapVehicle = (v: VehicleDto): Vehicle => {
  const normalizedImages =
    Array.isArray(v.images) && v.images.length > 0
      ? (v.images.map(resolveApiAssetUrl).filter(Boolean) as string[])
      : v.image
        ? [resolveApiAssetUrl(v.image) as string]
        : [];

  const mainImage = resolveApiAssetUrl(v.image) || normalizedImages[0];

  return ({
  id: v._id || v.id || "",
  name: v.name || "",
  category: v.category || "bike",
  description: v.description,
  image: mainImage,
  images: normalizedImages,
  pricePerHour: v.pricePerHour ?? 0,
  pricePerDay: v.pricePerDay ?? 0,
  availability: Boolean(v.availability),
});
};

export const adminApi = {
  async analytics(token: string) {
    return request<{
      totalUsers: number;
      totalBookings: number;
      totalVehicles: number;
      activeUsers: number;
      monthlyRevenue: number;
    }>("/admin/analytics", token);
  },
  async listUsers(token: string) {
    return request<AdminUser[]>("/admin/users", token);
  },
  async updateUserStatus(token: string, userId: string, status: "active" | "blocked") {
    return request<{ message: string; user: { id: string; status: string } }>(
      `/admin/users/${userId}/status`,
      token,
      { method: "PUT", body: JSON.stringify({ status }) },
    );
  },
  async listBookings(token: string) {
    return request<AdminBooking[]>("/admin/bookings", token);
  },
  async listMessages(token: string) {
    return request<AdminMessage[]>("/admin/messages", token);
  },
  async replyMessage(token: string, messageId: string, adminReply: string) {
    return request("/admin/reply", token, { method: "POST", body: JSON.stringify({ messageId, adminReply }) });
  },
  async listVehicles() {
    const res = await fetch(`${API_BASE_URL}/vehicles`);
    const data = await parseJson(res);
    return Array.isArray(data) ? data.map(mapVehicle) : [];
  },
  async addVehicle(token: string, payload: Omit<Vehicle, "id"> & { imageFiles?: File[] | null }) {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("category", payload.category);
    form.append("description", payload.description || "");
    form.append("pricePerHour", String(payload.pricePerHour));
    form.append("pricePerDay", String(payload.pricePerDay));
    form.append("availability", String(payload.availability));
    if (payload.imageFiles && payload.imageFiles.length > 0) {
      payload.imageFiles.forEach((file) => form.append("images", file));
    } else if (payload.image) {
      form.append("image", payload.image);
    }
    return request<Vehicle>("/admin/vehicle", token, { method: "POST", body: form });
  },
  async updateVehicle(
    token: string,
    id: string,
    payload: Partial<Omit<Vehicle, "id">> & { imageFiles?: File[] | null },
  ) {
    const form = new FormData();
    if (payload.name != null) form.append("name", payload.name);
    if (payload.category != null) form.append("category", payload.category);
    if (payload.description != null) form.append("description", payload.description);
    if (payload.pricePerHour != null) form.append("pricePerHour", String(payload.pricePerHour));
    if (payload.pricePerDay != null) form.append("pricePerDay", String(payload.pricePerDay));
    if (payload.availability != null) form.append("availability", String(payload.availability));
    if (payload.imageFiles && payload.imageFiles.length > 0) {
      payload.imageFiles.forEach((file) => form.append("images", file));
    } else if (payload.image) {
      form.append("image", payload.image);
    }
    return request<Vehicle>(`/admin/vehicle/${id}`, token, { method: "PUT", body: form });
  },
  async deleteVehicle(token: string, id: string) {
    return request<{ message: string }>(`/admin/vehicle/${id}`, token, { method: "DELETE" });
  },
};
