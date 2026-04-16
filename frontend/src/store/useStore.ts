import { create } from "zustand";
import { api } from "@/lib/api";
import type { Booking, UserMessage, UserProfile } from "@/lib/types";

interface AppState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  bookings: Booking[];
  messages: UserMessage[];
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ ok: boolean; message?: string }>;
  setSessionFromToken: (token: string) => Promise<UserProfile | null>;
  register: (
    user: Omit<UserProfile, "id" | "role" | "status">,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  loadProfile: () => Promise<UserProfile | null>;
  loadBookings: () => Promise<Booking[]>;
  loadMessages: () => Promise<UserMessage[]>;
  createBooking: (payload: {
    vehicleId: string;
    durationType: "hour" | "day";
    startDate: string;
    endDate: string;
  }) => Promise<boolean>;
  sendMessage: (message: string) => Promise<boolean>;
  updateProfile: (payload: {
    name?: string;
    phone?: string;
    dob?: string;
    address?: string;
    city?: string;
    pincode?: string;
    aadhaarNumber?: string;
  }) => Promise<{ ok: boolean; message?: string; user?: UserProfile }>;
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

const normalizeErrorMessage = (message: string) => {
  if (/failed to fetch|networkerror/i.test(message)) {
    return "Server unreachable. Please start the backend.";
  }
  return message;
};

export const useStore = create<AppState>((set, get) => ({
  ...getInitialState(),
  bookings: [],
  messages: [],
  login: async (email: string, password: string) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      await get().loadBookings();
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Login failed";
      return { ok: false, message: normalizeErrorMessage(raw) };
    }
  },
  loginWithGoogle: async (credential: string) => {
    try {
      const data = await api.googleLogin(credential);
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      await get().loadBookings();
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Google login failed";
      return { ok: false, message: normalizeErrorMessage(raw) };
    }
  },
  setSessionFromToken: async (token: string) => {
    try {
      localStorage.setItem(tokenKey, token);
      set({ token, isAuthenticated: true });
      const user = await api.profile(token);
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user });
      await get().loadBookings();
      return user;
    } catch (err) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      set({ token: null, user: null, isAuthenticated: false, bookings: [] });
      return null;
    }
  },
  register: async (user, password) => {
    try {
      const data = await api.register({ ...user, password });
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true });
      await get().loadBookings();
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Registration failed";
      return { ok: false, message: normalizeErrorMessage(raw) };
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
  loadMessages: async () => {
    const token = get().token;
    if (!token) return [];
    try {
      const messages = await api.listMessages(token);
      set({ messages });
      return messages;
    } catch {
      set({ messages: [] });
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
      await get().loadMessages();
      return true;
    } catch {
      return false;
    }
  },
  updateProfile: async (payload) => {
    const token = get().token;
    if (!token) return { ok: false, message: "Not authenticated" };
    try {
      const user = await api.updateProfile(token, payload);
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user });
      return { ok: true, user };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Update failed";
      return { ok: false, message: normalizeErrorMessage(raw) };
    }
  },
}));
