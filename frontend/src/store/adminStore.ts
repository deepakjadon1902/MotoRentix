import { create } from "zustand";
import { API_BASE_URL } from "@/lib/apiBase";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

interface AdminState {
  token: string | null;
  user: AdminUser | null;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ ok: boolean; message?: string }>;
  setSession: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const tokenKey = 'motorentix_admin_token';
const userKey = 'motorentix_admin_user';

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as AdminUser;
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
    isAdminAuthenticated: Boolean(token),
  };
};

const normalizeErrorMessage = (message: string) => {
  if (/failed to fetch|networkerror/i.test(message)) {
    return 'Server unreachable. Please start the backend.';
  }
  return message;
};

export const useAdminStore = create<AdminState>((set) => ({
  ...getInitialState(),
  login: async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data === 'object' && data && 'message' in data
            ? (data as { message?: string }).message || 'Login failed'
            : 'Login failed';
        return { ok: false, message: normalizeErrorMessage(message) };
      }
      const token = data.token as string;
      const user = data.user as AdminUser;

      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));

      set({ token, user, isAdminAuthenticated: true });
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Login failed';
      return { ok: false, message: normalizeErrorMessage(raw) };
    }
  },
  loginWithGoogle: async (credential: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data === "object" && data && "message" in data
            ? (data as { message?: string }).message || "Google login failed"
            : "Google login failed";
        return { ok: false, message: normalizeErrorMessage(message) };
      }

      const token = data.token as string;
      const user = data.user as AdminUser;

      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));

      set({ token, user, isAdminAuthenticated: true });
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Google login failed";
      return { ok: false, message: normalizeErrorMessage(raw) };
    }
  },
  setSession: (token: string, user: AdminUser) => {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
    set({ token, user, isAdminAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    set({ token: null, user: null, isAdminAuthenticated: false });
  },
}));
