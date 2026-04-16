import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const dirname = (url) => path.dirname(fileURLToPath(url));

export const backendRootDir = () => path.resolve(dirname(import.meta.url), "..");

export const uploadsDir = () => path.join(backendRootDir(), "uploads");

// Legacy location used when paths were resolved from the repo root
// (resulting in `<repo>/backend/backend/uploads`).
export const legacyUploadsDir = () => path.join(backendRootDir(), "backend", "uploads");

export const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

