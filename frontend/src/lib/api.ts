import type { Booking, UserMessage, UserProfile, Vehicle } from "@/lib/types";
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

type BookingDto = {
  _id?: string;
  id?: string;
  vehicleId?: VehicleDto | string;
  vehicleName?: string;
  durationType?: "hour" | "day";
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: "pending" | "confirmed" | "completed";
  createdAt?: string;
};

type MessageDto = {
  _id?: string;
  id?: string;
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

const request = async <T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> => {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
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

export const api = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    dob?: string;
    address?: string;
    city?: string;
    pincode?: string;
    aadhaarNumber?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  async login(payload: { email: string; password: string }): Promise<{ token: string; user: UserProfile }> {
    return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
  async googleLogin(credential: string): Promise<{ token: string; user: UserProfile }> {
    return request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
  },
  async profile(token: string): Promise<UserProfile> {
    return request("/users/profile", { token });
  },
  async updateProfile(
    token: string,
    payload: {
      name?: string;
      dob?: string;
      address?: string;
      city?: string;
      pincode?: string;
      aadhaarNumber?: string;
    }
  ): Promise<UserProfile> {
    return request("/users/profile", { method: "PUT", token, body: JSON.stringify(payload) });
  },
  async listVehicles(): Promise<Vehicle[]> {
    const data = await request<VehicleDto[]>("/vehicles");
    return data.map(mapVehicle);
  },
  async getVehicle(id: string): Promise<Vehicle> {
    const data = await request<VehicleDto>(`/vehicles/${id}`);
    return mapVehicle(data);
  },
  async createBooking(
    token: string,
    payload: { vehicleId: string; durationType: "hour" | "day"; startDate: string; endDate: string },
  ): Promise<BookingDto> {
    return request("/bookings", { method: "POST", token, body: JSON.stringify(payload) });
  },
  async listBookings(token: string): Promise<Booking[]> {
    const data = await request<BookingDto[]>("/bookings/user", { token });
    return data.map((b) => ({
      id: b._id || b.id || "",
      vehicle: {
        id:
          typeof b.vehicleId === "string"
            ? b.vehicleId
            : b.vehicleId?._id || b.vehicleId?.id || "",
        name:
          typeof b.vehicleId === "string"
            ? b.vehicleName || "Vehicle"
            : b.vehicleId?.name || b.vehicleName || "Vehicle",
        category: typeof b.vehicleId === "string" ? undefined : b.vehicleId?.category,
        images: (() => {
          if (typeof b.vehicleId === "string") return undefined;
          const dto = b.vehicleId as VehicleDto | undefined;
          if (Array.isArray(dto?.images) && dto.images.length > 0) {
            return dto.images.map(resolveApiAssetUrl).filter(Boolean) as string[];
          }
          return dto?.image ? [resolveApiAssetUrl(dto.image) as string] : [];
        })(),
        image: (() => {
          if (typeof b.vehicleId === "string") return undefined;
          const dto = b.vehicleId as VehicleDto | undefined;
          const img = resolveApiAssetUrl(dto?.image);
          if (img) return img;
          const images = Array.isArray(dto?.images) ? (dto?.images || []).map(resolveApiAssetUrl).filter(Boolean) as string[] : [];
          return images[0];
        })(),
        pricePerHour: typeof b.vehicleId === "string" ? undefined : b.vehicleId?.pricePerHour,
        pricePerDay: typeof b.vehicleId === "string" ? undefined : b.vehicleId?.pricePerDay,
      },
      durationType: b.durationType || "day",
      startDate: b.startDate || "",
      endDate: b.endDate || "",
      totalPrice: b.totalPrice ?? 0,
      status: b.status || "pending",
      createdAt: b.createdAt,
    }));
  },
  async listMessages(token: string): Promise<UserMessage[]> {
    const data = await request<MessageDto[]>("/messages", { token });
    return data.map((m) => ({
      id: m._id || m.id || "",
      message: m.message || "",
      adminReply: m.adminReply || "",
      createdAt: m.createdAt,
    }));
  },
  async sendMessage(token: string, message: string): Promise<void> {
    await request("/messages", {
      method: "POST",
      token,
      body: JSON.stringify({ message }),
    });
  },
  async adminAnalytics(token: string): Promise<{
    totalUsers: number;
    totalBookings: number;
    totalVehicles: number;
    activeUsers: number;
    monthlyRevenue: number;
  }> {
    return request("/admin/analytics", { token });
  },
  async googleConfig(): Promise<{ clientId: string }> {
    return request("/config/google");
  },
};
