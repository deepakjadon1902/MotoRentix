import { API_BASE_URL } from "@/lib/apiBase";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const configuredImageKitEndpoint = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/js0wivvqg").replace(/\/$/, "");

const imageKitEndpoints = [
  configuredImageKitEndpoint,
  "https://ik.imagekit.io/js0wivvqg",
].filter(Boolean);

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

export const optimizeImageUrl = (
  value: string | undefined,
  options: { width?: number; height?: number; quality?: number } = {},
) => {
  const resolved = resolveApiAssetUrl(value);
  if (!resolved || !isAbsoluteUrl(resolved)) return resolved;

  const endpoint = imageKitEndpoints.find((item) => resolved.startsWith(`${item}/`));
  if (!endpoint || resolved.includes("/tr:")) return resolved;

  const transforms = [
    options.width ? `w-${options.width}` : "",
    options.height ? `h-${options.height}` : "",
    "fo-auto",
    `q-${options.quality || 80}`,
    "f-webp",
  ].filter(Boolean);

  const path = resolved.slice(endpoint.length);
  return `${endpoint}/tr:${transforms.join(",")}${path}`;
};
