import { create } from 'zustand';

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
  login: (email: string, password: string) => Promise<boolean>;
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

export const useAdminStore = create<AdminState>((set) => ({
  ...getInitialState(),
  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      const token = data.token as string;
      const user = data.user as AdminUser;

      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));

      set({ token, user, isAdminAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    set({ token: null, user: null, isAdminAuthenticated: false });
  },
}));
