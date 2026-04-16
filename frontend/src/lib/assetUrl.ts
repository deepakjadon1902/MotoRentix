import { API_BASE_URL } from "@/lib/apiBase";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const resolveApiAssetUrl = (value: string | undefined) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (isAbsoluteUrl(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (isAbsoluteUrl(API_BASE_URL)) {
    try {
      return new URL(path, API_BASE_URL).toString().replace(/\/api\/uploads\//, "/uploads/");
    } catch {
      return path;
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }

  return path;
};

