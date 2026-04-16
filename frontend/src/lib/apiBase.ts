const DEFAULT_API_BASE_URL = "/api";

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

export const API_BASE_URL = normalizeBaseUrl(envBaseUrl || DEFAULT_API_BASE_URL);

