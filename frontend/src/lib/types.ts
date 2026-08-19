export type VehicleCategory = "bike" | "scooter" | "electric_bike" | "electric_scooter";

export interface Vehicle {
  id: string;
  tenantId?: string | {
    _id?: string;
    id?: string;
    companyName?: string;
    ownerName?: string;
    email?: string;
    phone?: string;
    status?: string;
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      accentColor?: string;
    };
  };
  branchId?: string | {
    _id?: string;
    id?: string;
    name?: string;
    city?: string;
    address?: string;
    status?: string;
  };
  name: string;
  bikeNumber?: string;
  category: VehicleCategory;
  description?: string;
  image?: string;
  images?: string[];
  features?: string[];
  engineNumber?: string;
  chassisNumber?: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  availability: boolean;
  status?: "available" | "booked" | "maintenance" | "disabled" | "archived";
  availablePaymentMethods?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleSummary {
  id: string;
  name: string;
  category: VehicleCategory;
  image?: string;
  images?: string[];
  pricePerHour?: number;
  pricePerDay?: number;
}

export type BookingStatus = "pending" | "confirmed" | "running" | "rejected" | "completed" | "cancelled" | "refunded" | "overdue";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Booking {
  id: string;
  tenant?: {
    id: string;
    companyName?: string;
    phone?: string;
    logoUrl?: string;
  };
  vehicle: VehicleSummary;
  durationType: "hour" | "day" | "week";
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}

export interface UserMessage {
  id: string;
  subject?: string;
  message: string;
  adminReply?: string;
  direction?: "user_to_admin" | "admin_to_user";
  audience?: "selected" | "users" | "clients" | "collective";
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  address?: string;
  city?: string;
  pincode?: string;
  aadhaarNumber?: string;
  role: "user" | "admin" | "owner" | "staff";
  tenantId?: string;
  status: "active" | "blocked";
}

export interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycles?: Array<{
    cycle: "monthly" | "half_yearly" | "yearly";
    label: string;
    price: number;
    months: number;
    active?: boolean;
    sortOrder?: number;
  }>;
  recommendedFor?: string;
  featureList?: string[];
  hiddenFeatureList?: string[];
  planBadges?: string[];
  bikeLimit: number;
  staffLimit: number;
  branchLimit: number;
  bookingLimit?: number;
  storageLimitMb?: number;
  bandwidthLimitGb?: number;
  apiLimitMonthly?: number;
  customDomainLimit?: number;
  analyticsLevel: "basic" | "advanced" | "full";
  supportLevel?: "standard" | "priority" | "dedicated";
  customBranding: boolean;
  apiAccess: boolean;
  featureFlags?: Record<string, boolean | string>;
  gatewayAvailability?: Record<string, boolean>;
  navigationItems?: Array<{
    label: string;
    route: string;
    icon: string;
    featureKey: string;
    exact?: boolean;
    sortOrder?: number;
  }>;
  comparisonFeatures?: Array<{
    label: string;
    featureKey: string;
    category?: string;
    sortOrder?: number;
  }>;
  faqs?: Array<{ question?: string; answer?: string }>;
  active: boolean;
}
