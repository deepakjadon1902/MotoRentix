export type VehicleCategory = "bike" | "scooter";

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  description?: string;
  image?: string;
  images?: string[];
  pricePerHour: number;
  pricePerDay: number;
  availability: boolean;
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

export type BookingStatus = "pending" | "confirmed" | "completed";

export interface Booking {
  id: string;
  vehicle: VehicleSummary;
  durationType: "hour" | "day";
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
}

export interface UserMessage {
  id: string;
  message: string;
  adminReply?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dob?: string;
  address?: string;
  city?: string;
  pincode?: string;
  aadhaarNumber?: string;
  role: "user" | "admin";
  status: "active" | "blocked";
}
