import { create } from "zustand";
import { api } from "@/lib/api";
import type { Booking, UserProfile } from "@/lib/types";

interface AppState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  bookings: Booking[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: Omit<UserProfile, "id" | "role" | "status">, password: string) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<UserProfile | null>;
  loadBookings: () => Promise<Booking[]>;
  createBooking: (payload: {
    vehicleId: string;
    durationType: "hour" | "day";
    startDate: string;
    endDate: string;
  }) => Promise<boolean>;
  sendMessage: (message: string) => Promise<boolean>;
}

const tokenKey = "motorentix_user_token";
const userKey = "motorentix_user";

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as UserProfile;
  } catch {
    return null;
  }
};

const getInitialState = () => {
  const token = localStorage.getItem(tokenKey);
  const user = safeParse(localStorage.getItem(userKey));
  return {
    token,
    user,
    isAuthenticated: Boolean(token),
  };
};

export const useStore = create<AppState>((set, get) => ({
  ...getInitialState(),
  bookings: [],
  login: async (email: string, password: string) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      await get().loadBookings();
      return true;
    } catch {
      return false;
    }
  },
  register: async (user, password) => {
    try {
      const data = await api.register({ ...user, password });
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      await get().loadBookings();
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    set({ token: null, user: null, isAuthenticated: false, bookings: [] });
  },
  loadProfile: async () => {
    const token = get().token;
    if (!token) return null;
    try {
      const user = await api.profile(token);
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user });
      return user;
    } catch {
      return null;
    }
  },
  loadBookings: async () => {
    const token = get().token;
    if (!token) return [];
    try {
      const bookings = await api.listBookings(token);
      set({ bookings });
      return bookings;
    } catch {
      set({ bookings: [] });
      return [];
    }
  },
  createBooking: async (payload) => {
    const token = get().token;
    if (!token) return false;
    try {
      await api.createBooking(token, payload);
      await get().loadBookings();
      return true;
    } catch {
      return false;
    }
  },
  sendMessage: async (message: string) => {
    const token = get().token;
    if (!token) return false;
    try {
      await api.sendMessage(token, message);
      return true;
    } catch {
      return false;
    }
  },
}));
