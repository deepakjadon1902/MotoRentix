import { API_BASE_URL } from "@/lib/apiBase";

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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : "Request failed";
    throw new Error(message);
  }
  return data as T;
};

export type TenantVehicle = {
  _id?: string;
  id?: string;
  name?: string;
  bikeNumber?: string;
  category?: "bike" | "scooter" | "electric_bike" | "electric_scooter";
  description?: string;
  image?: string;
  images?: string[];
  imageFiles?: File[];
  features?: string[];
  engineNumber?: string;
  chassisNumber?: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  availability?: boolean;
  status?: string;
};

export type TenantBooking = {
  _id?: string;
  id?: string;
  userId?: { name?: string; email?: string; phone?: string };
  customerId?: { name?: string; email?: string; phone?: string };
  vehicleId?: { name?: string; bikeNumber?: string; category?: string };
  durationType?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: "pending" | "confirmed" | "rejected" | "completed";
  createdAt?: string;
};

export type TenantUserBundle = {
  customers: Array<{ _id?: string; id?: string; name?: string; email?: string; phone?: string; status?: string; createdAt?: string }>;
  staff: Array<{ _id?: string; id?: string; name?: string; email?: string; phone?: string; role?: string; status?: string; createdAt?: string }>;
};

export type TenantPayment = {
  _id?: string;
  id?: string;
  paymentFor?: "owner_subscription" | "customer_rental";
  provider?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export type TenantSettings = {
  tenant?: {
    _id?: string;
    id?: string;
    companyName?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    status?: string;
    marketplaceVisible?: boolean;
  };
  entitlements?: {
    code?: string;
    name?: string;
    limits?: Record<string, number>;
    features?: Record<string, boolean | string>;
    gateways?: Record<string, boolean>;
    billingCycles?: Array<{ cycle: string; label: string; price: number; months: number; active?: boolean; sortOrder?: number }>;
    navigationItems?: Array<{ label: string; route: string; icon: string; featureKey: string; exact?: boolean; sortOrder?: number }>;
    comparisonFeatures?: Array<{ label: string; featureKey: string; category?: string; sortOrder?: number }>;
    faqs?: Array<{ question?: string; answer?: string }>;
    customBranding?: boolean;
    apiAccess?: boolean;
  };
  domains?: Array<{
    _id?: string;
    id?: string;
    domain?: string;
    type?: "subdomain" | "custom";
    status?: "pending_verification" | "verified" | "expired" | "disconnected";
    isPrimary?: boolean;
    verificationToken?: string;
    dnsTarget?: string;
    sslStatus?: string;
  }>;
  paymentMethods?: {
    razorpay?: { enabled?: boolean; keyId?: string; keySecret?: string; webhookSecret?: string };
    payu?: { enabled?: boolean; merchantKey?: string; salt?: string };
    stripe?: { enabled?: boolean; publishableKey?: string; secretKey?: string; webhookSecret?: string };
    upi?: { enabled?: boolean; upiId?: string; displayName?: string };
    cash?: { enabled?: boolean };
    bankTransfer?: { enabled?: boolean; accountName?: string; accountNumber?: string; ifsc?: string; bankName?: string };
  };
  branding?: {
    logoUrl?: string;
    dashboardLogoUrl?: string;
    faviconUrl?: string;
    watermarkUrl?: string;
    homepageBannerUrl?: string;
    loginBackgroundUrl?: string;
    companyDisplayName?: string;
    supportEmail?: string;
    supportPhone?: string;
    address?: string;
    footerText?: string;
    socialLinks?: Record<string, string>;
  };
  theme?: {
    mode?: "light" | "dark" | "auto";
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    buttonStyle?: "rounded" | "pill" | "square";
    borderRadius?: number;
    typography?: string;
    sidebarStyle?: string;
    headerStyle?: string;
    footerStyle?: string;
    homepageLayout?: string;
    cardDesign?: string;
    animations?: boolean;
    logoPlacement?: string;
    customCss?: string;
  };
  policies?: {
    privacyPolicy?: string;
    termsAndConditions?: string;
    refundPolicy?: string;
    cancellationPolicy?: string;
    bookingRules?: string;
    vehicleRules?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    openGraphImage?: string;
    googleAnalyticsId?: string;
    googleSearchConsoleVerification?: string;
    metaPixelId?: string;
    googleTagManagerId?: string;
    customHeadScripts?: string;
  };
  localization?: { defaultLanguage?: string; enabledLanguages?: string[] };
  integrations?: Record<string, unknown>;
  mobileBranding?: Record<string, string | undefined>;
  hostingUsage?: Record<string, number | string | undefined>;
  invoice?: { gstNumber?: string; taxPercent?: number; prefix?: string; design?: string; headerHtml?: string; footerHtml?: string };
  businessHours?: { open?: string; close?: string };
};

export type TenantLicenseSnapshot = {
  active?: boolean;
  status?: "trial" | "active" | "renewal_due" | "expired" | "suspended" | "cancelled" | "blocked_by_admin" | "pending_verification";
  inGrace?: boolean;
  canLogin?: boolean;
  canBook?: boolean;
  canUseApi?: boolean;
  subscription?: {
    endDate?: string;
    graceEndsAt?: string;
    billingCycle?: string;
    invoiceNumber?: string;
    paymentStatus?: string;
  };
  license?: {
    licenseKey?: string;
    status?: string;
    expiresAt?: string;
  };
  entitlements?: TenantSettings["entitlements"];
};

export const tenantApi = {
  overview: (token: string) => request<Record<string, unknown>>("/tenant/overview", token),
  vehicles: (token: string) => request<TenantVehicle[]>("/tenant/vehicles", token),
  addVehicle: (token: string, payload: Partial<TenantVehicle>) =>
    request<TenantVehicle>("/tenant/vehicles", token, { method: "POST", body: vehicleFormData(payload) }),
  updateVehicle: (token: string, id: string, payload: Partial<TenantVehicle>) =>
    request<TenantVehicle>(`/tenant/vehicles/${id}`, token, { method: "PUT", body: vehicleFormData(payload) }),
  deleteVehicle: (token: string, id: string) =>
    request<{ message: string }>(`/tenant/vehicles/${id}`, token, { method: "DELETE" }),
  bookings: (token: string) => request<TenantBooking[]>("/tenant/bookings", token),
  updateBookingStatus: (token: string, id: string, status: NonNullable<TenantBooking["status"]>) =>
    request<TenantBooking>(`/tenant/bookings/${id}/status`, token, { method: "PUT", body: JSON.stringify({ status }) }),
  users: (token: string) => request<TenantUserBundle>("/tenant/users", token),
  payments: (token: string) => request<TenantPayment[]>("/tenant/payments", token),
  settings: (token: string) => request<TenantSettings>("/tenant/settings", token),
  license: (token: string) => request<TenantLicenseSnapshot>("/subscriptions/me/license", token),
  updateSettings: (token: string, payload: TenantSettings) =>
    request<TenantSettings>("/tenant/settings", token, { method: "PUT", body: JSON.stringify(payload) }),
  createDomain: (token: string, payload: { domain: string; type?: "subdomain" | "custom"; makePrimary?: boolean }) =>
    request<NonNullable<TenantSettings["domains"]>[number]>("/tenant/domains", token, { method: "POST", body: JSON.stringify(payload) }),
  updateDomain: (token: string, id: string, payload: { status?: string; isPrimary?: boolean }) =>
    request<NonNullable<TenantSettings["domains"]>[number]>(`/tenant/domains/${id}`, token, { method: "PUT", body: JSON.stringify(payload) }),
};

const vehicleFormData = (payload: Partial<TenantVehicle>) => {
  const form = new FormData();
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
      return;
    }
    form.append(key, String(value));
  };

  append("name", payload.name);
  append("bikeNumber", payload.bikeNumber);
  append("category", payload.category);
  append("description", payload.description);
  append("features", payload.features);
  append("engineNumber", payload.engineNumber);
  append("chassisNumber", payload.chassisNumber);
  append("pricePerHour", payload.pricePerHour);
  append("pricePerDay", payload.pricePerDay);
  append("pricePerWeek", payload.pricePerWeek);
  append("pricePerMonth", payload.pricePerMonth);
  append("securityDeposit", payload.securityDeposit);
  append("availability", payload.availability);
  append("status", payload.status);

  payload.imageFiles?.forEach((file) => form.append("images", file));
  return form;
};
