import type { Booking, SubscriptionPlan, UserMessage, UserProfile, Vehicle } from "@/lib/types";
import { API_BASE_URL } from "@/lib/apiBase";
import { resolveApiAssetUrl } from "@/lib/assetUrl";

type VehicleDto = {
  _id?: string;
  id?: string;
  tenantId?: Vehicle["tenantId"];
  branchId?: Vehicle["branchId"];
  name?: string;
  bikeNumber?: string;
  category?: Vehicle["category"];
  description?: string;
  image?: string;
  images?: string[];
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  availability?: boolean;
  status?: Vehicle["status"];
  availablePaymentMethods?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type BookingDto = {
  _id?: string;
  id?: string;
  tenantId?: string | {
    _id?: string;
    id?: string;
    companyName?: string;
    phone?: string;
    branding?: { logoUrl?: string };
  };
  vehicleId?: VehicleDto | string;
  vehicleName?: string;
  durationType?: "hour" | "day" | "week";
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: Booking["status"];
  paymentStatus?: Booking["paymentStatus"];
  createdAt?: string;
};

type MessageDto = {
  _id?: string;
  id?: string;
  subject?: string;
  message?: string;
  adminReply?: string;
  direction?: UserMessage["direction"];
  audience?: UserMessage["audience"];
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
  tenantId: v.tenantId,
  branchId: v.branchId,
  name: v.name || "",
  bikeNumber: v.bikeNumber,
  category: v.category || "bike",
  description: v.description,
  image: mainImage,
  images: normalizedImages,
  pricePerHour: v.pricePerHour ?? 0,
  pricePerDay: v.pricePerDay ?? 0,
  pricePerWeek: v.pricePerWeek ?? 0,
  availability: Boolean(v.availability),
  status: v.status,
  availablePaymentMethods: v.availablePaymentMethods || [],
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});
};

export const api = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    dob?: string;
    address?: string;
    city?: string;
    pincode?: string;
    aadhaarNumber?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  async registerTenantOwner(payload: {
    companyName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    planCode: string;
    billingCycle: "monthly" | "half_yearly" | "yearly";
  }): Promise<{ token: string; user: UserProfile; tenant: unknown; subscription: unknown }> {
    return request("/auth/tenant/register", { method: "POST", body: JSON.stringify(payload) });
  },
  async listPlans(): Promise<SubscriptionPlan[]> {
    return request<SubscriptionPlan[]>("/subscriptions/plans");
  },
  async login(payload: { email: string; password: string }): Promise<{ token: string; user: UserProfile }> {
    return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
  async requestPasswordResetOtp(email: string): Promise<{ message: string; devOtp?: string }> {
    return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },
  async verifyPasswordResetOtp(payload: { email: string; otp: string }): Promise<{ token: string; resetToken: string; user: UserProfile }> {
    return request("/auth/verify-reset-otp", { method: "POST", body: JSON.stringify(payload) });
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
      phone?: string;
      dob?: string;
      address?: string;
      city?: string;
      pincode?: string;
      aadhaarNumber?: string;
    }
  ): Promise<UserProfile> {
    return request("/users/profile", { method: "PUT", token, body: JSON.stringify(payload) });
  },
  async updatePassword(
    token: string,
    payload: { currentPassword?: string; newPassword: string; resetToken?: string },
  ): Promise<{ message: string }> {
    return request("/users/password", { method: "PUT", token, body: JSON.stringify(payload) });
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
    payload: { vehicleId: string; durationType: "hour" | "day" | "week"; startDate: string; endDate: string },
  ): Promise<BookingDto> {
    return request("/bookings", { method: "POST", token, body: JSON.stringify(payload) });
  },
  async createCustomerRentalPayment(
    token: string,
    payload: { bookingId: string; provider: string; payerUpiId?: string },
  ): Promise<{
    payment: { _id?: string; id?: string; amount?: number; status?: string; provider?: string };
    checkout?: {
      provider?: string;
      keyId?: string;
      orderId?: string;
      amount?: number;
      currency?: string;
      upiId?: string;
      displayName?: string;
      qrDataUrl?: string;
      upiIntentUrl?: string;
      note?: string;
      redirectUrl?: string;
      sessionId?: string;
      form?: {
        action: string;
        method?: string;
        fields: Record<string, string>;
      };
    };
  }> {
    return request("/payments/customer-rental", { method: "POST", token, body: JSON.stringify(payload) });
  },
  async verifyCustomerRentalRazorpayPayment(
    token: string,
    payload: {
      paymentId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ): Promise<{ payment: { _id?: string; id?: string; amount?: number; status?: string; provider?: string }; booking?: BookingDto }> {
    return request("/payments/customer-rental/razorpay/verify", { method: "POST", token, body: JSON.stringify(payload) });
  },
  async listBookings(token: string): Promise<Booking[]> {
    const data = await request<BookingDto[]>("/bookings/user", { token });
    return data.map((b) => ({
      id: b._id || b.id || "",
      tenant: typeof b.tenantId === "object" && b.tenantId
        ? {
          id: b.tenantId._id || b.tenantId.id || "",
          companyName: b.tenantId.companyName,
          phone: b.tenantId.phone,
          logoUrl: resolveApiAssetUrl(b.tenantId.branding?.logoUrl),
        }
        : undefined,
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
      paymentStatus: b.paymentStatus || "pending",
      createdAt: b.createdAt,
    }));
  },
  async listMessages(token: string): Promise<UserMessage[]> {
    const data = await request<MessageDto[]>("/messages", { token });
    return data.map((m) => ({
      id: m._id || m.id || "",
      subject: m.subject,
      message: m.message || "",
      adminReply: m.adminReply || "",
      direction: m.direction,
      audience: m.audience,
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
