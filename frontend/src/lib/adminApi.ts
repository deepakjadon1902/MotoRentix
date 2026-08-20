import type { Vehicle } from "@/lib/types";
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
  features?: string[];
  engineNumber?: string;
  chassisNumber?: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  availability?: boolean;
  status?: "available" | "booked" | "maintenance" | "disabled" | "archived";
  createdAt?: string;
  updatedAt?: string;
};

export type AdminVehiclePayload = {
  tenantId?: string;
  branchId?: string;
  name: string;
  bikeNumber?: string;
  category: Vehicle["category"];
  description?: string;
  image?: string;
  images?: string[];
  imageFiles?: File[];
  features?: string[];
  engineNumber?: string;
  chassisNumber?: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  availability: boolean;
  status?: NonNullable<Vehicle["status"]>;
};

export type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  aadhaarNumber?: string;
  role?: "user" | "admin" | "owner" | "staff";
  status?: "active" | "blocked";
  createdAt?: string;
};

export type AdminBooking = {
  _id?: string;
  id?: string;
  userId?: { name?: string; email?: string; phone?: string; address?: string; city?: string; pincode?: string; aadhaarNumber?: string };
  vehicleId?: { name?: string; category?: string; bikeNumber?: string };
  durationType?: "hour" | "day" | "week";
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  status?: "pending" | "confirmed" | "rejected" | "completed" | "running" | "cancelled" | "refunded" | "overdue";
  createdAt?: string;
};

export type AdminMessage = {
  _id?: string;
  id?: string;
  userId?: { _id?: string; id?: string; name?: string; email?: string; role?: string };
  sentByAdminId?: { _id?: string; id?: string; name?: string; email?: string };
  direction?: "user_to_admin" | "admin_to_user";
  audience?: "selected" | "users" | "collective";
  subject?: string;
  message?: string;
  adminReply?: string;
  createdAt?: string;
};

export type AdminSubscription = {
  _id?: string;
  id?: string;
  tenantId?: AdminTenant | string;
  planId?: AdminPlan | string;
  billingCycle?: "monthly" | "half_yearly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  autoRenew?: boolean;
  status?: "trial" | "active" | "renewal_due" | "expired" | "suspended" | "cancelled" | "blocked_by_admin" | "pending_verification" | "past_due";
  createdAt?: string;
};

export type AdminTenant = {
  _id?: string;
  id?: string;
  companyName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  planId?: AdminPlan;
  subscriptionId?: AdminSubscription;
  status?: "trial" | "active" | "renewal_due" | "expired" | "suspended" | "cancelled" | "blocked_by_admin" | "pending_verification" | "past_due" | "disabled";
  createdAt?: string;
};

export type AdminBranch = {
  _id?: string;
  id?: string;
  tenantId?: AdminTenant | string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  status?: "active" | "disabled";
  createdAt?: string;
};

export type AdminPlan = {
  _id?: string;
  id?: string;
  name?: string;
  code?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  billingCycles?: Array<{ cycle: "monthly" | "half_yearly" | "yearly"; label: string; price: number; months: number; active?: boolean; sortOrder?: number }>;
  bikeLimit?: number;
  staffLimit?: number;
  branchLimit?: number;
  bookingLimit?: number;
  storageLimitMb?: number;
  bandwidthLimitGb?: number;
  apiLimitMonthly?: number;
  customDomainLimit?: number;
  analyticsLevel?: "basic" | "advanced" | "full";
  supportLevel?: "standard" | "priority" | "dedicated";
  customBranding?: boolean;
  apiAccess?: boolean;
  featureFlags?: Record<string, boolean | string>;
  gatewayAvailability?: Record<string, boolean>;
  planBadges?: string[];
  recommendedFor?: string;
  featureList?: string[];
  hiddenFeatureList?: string[];
  active?: boolean;
  sortOrder?: number;
};

export type AdminPayment = {
  _id?: string;
  id?: string;
  tenantId?: AdminTenant;
  paymentFor?: "owner_subscription" | "customer_rental";
  bookingId?: AdminBooking;
  subscriptionId?: AdminSubscription;
  provider?: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount?: number;
  currency?: string;
  status?: "pending" | "paid" | "failed" | "refunded";
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
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

const vehicleFormData = (payload: Partial<AdminVehiclePayload>) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || key === "imageFiles") return;
    if (Array.isArray(value)) {
      if (key === "features" || key === "images") {
        form.append(key, JSON.stringify(value));
      }
      return;
    }
    form.append(key, String(value));
  });
  (payload.imageFiles || []).forEach((file) => form.append("images", file));
  return form;
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
  features: v.features || [],
  engineNumber: v.engineNumber,
  chassisNumber: v.chassisNumber,
  pricePerHour: v.pricePerHour ?? 0,
  pricePerDay: v.pricePerDay ?? 0,
  pricePerWeek: v.pricePerWeek ?? 0,
  pricePerMonth: v.pricePerMonth ?? 0,
  securityDeposit: v.securityDeposit ?? 0,
  availability: Boolean(v.availability),
  status: v.status,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
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
  async updateBookingStatus(
    token: string,
    bookingId: string,
    status: "pending" | "confirmed" | "rejected" | "completed",
  ) {
    return request<{ message: string }>(`/admin/bookings/${bookingId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
  async listMessages(token: string) {
    return request<AdminMessage[]>("/admin/messages", token);
  },
  async replyMessage(token: string, messageId: string, adminReply: string) {
    return request("/admin/reply", token, { method: "POST", body: JSON.stringify({ messageId, adminReply }) });
  },
  async sendAdminMessage(
    token: string,
    payload: {
      audience: "selected" | "users" | "collective";
      recipientIds?: string[];
      subject?: string;
      message: string;
    },
  ) {
    return request<{ message: string; count: number }>("/admin/messages/send", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listSubscriptions(token: string) {
    return request<AdminSubscription[]>("/admin/subscriptions", token);
  },
  async createSubscription(
    token: string,
    payload: Omit<AdminSubscription, "_id" | "id" | "createdAt" | "tenantId" | "planId"> & { tenantId: string; planId: string },
  ) {
    return request<AdminSubscription>("/admin/subscriptions", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateSubscription(token: string, id: string, payload: Partial<AdminSubscription>) {
    return request<AdminSubscription>(`/admin/subscriptions/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async deleteSubscription(token: string, id: string) {
    return request<{ message: string }>(`/admin/subscriptions/${id}`, token, { method: "DELETE" });
  },
  async listTenants(token: string) {
    return request<AdminTenant[]>("/admin/tenants", token);
  },
  async createTenantClient(token: string, payload: {
    companyName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    planId: string;
    billingCycle: "monthly" | "half_yearly" | "yearly";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    startDate?: string;
    endDate?: string;
  }) {
    return request<{ tenant: AdminTenant; subscription: AdminSubscription }>("/admin/tenants", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateTenantStatus(token: string, tenantId: string, status: NonNullable<AdminTenant["status"]>) {
    return request<{ message: string; tenant: AdminTenant }>(`/admin/tenants/${tenantId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
  async assignTenantPlan(token: string, tenantId: string, payload: {
    planId: string;
    billingCycle: "monthly" | "half_yearly" | "yearly";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    startDate?: string;
    endDate?: string;
  }) {
    return request<{ tenant: AdminTenant; subscription: AdminSubscription }>(`/admin/tenants/${tenantId}/plan`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listPlans(token: string) {
    return request<AdminPlan[]>("/admin/plans", token);
  },
  async createPlan(token: string, payload: AdminPlan) {
    return request<AdminPlan>("/admin/plans", token, { method: "POST", body: JSON.stringify(payload) });
  },
  async updatePlan(token: string, id: string, payload: AdminPlan) {
    return request<AdminPlan>(`/admin/plans/${id}`, token, { method: "PUT", body: JSON.stringify(payload) });
  },
  async listPayments(token: string) {
    return request<AdminPayment[]>("/admin/payments", token);
  },
  async updatePaymentStatus(token: string, paymentId: string, status: "paid" | "failed" | "refunded") {
    return request<AdminPayment>(`/admin/payments/${paymentId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
  async listVehicles(token: string) {
    const data = await request<VehicleDto[]>("/admin/vehicles", token);
    return Array.isArray(data) ? data.map(mapVehicle) : [];
  },
  async createVehicle(token: string, payload: AdminVehiclePayload) {
    const data = await request<VehicleDto>("/admin/vehicles", token, {
      method: "POST",
      body: vehicleFormData(payload),
    });
    return mapVehicle(data);
  },
  async updateVehicle(token: string, id: string, payload: Partial<AdminVehiclePayload>) {
    const data = await request<VehicleDto>(`/admin/vehicles/${id}`, token, {
      method: "PUT",
      body: vehicleFormData(payload),
    });
    return mapVehicle(data);
  },
  async deleteVehicle(token: string, id: string) {
    return request<{ message: string; archived?: boolean }>(`/admin/vehicles/${id}`, token, { method: "DELETE" });
  },
  async listBranches(token: string, tenantId?: string) {
    const suffix = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    return request<AdminBranch[]>(`/admin/branches${suffix}`, token);
  },
};
