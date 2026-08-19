import fs from "fs/promises";
import path from "path";
import ImageKit from "imagekit";
import sharp from "sharp";

const hasImageKitConfig = () =>
  Boolean(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT);

const createClient = () =>
  new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

export const uploadImageFile = async (file) => {
  if (!file) return null;
  const originalBase = path.basename(file.originalname || file.filename || `motorentix-${Date.now()}`, path.extname(file.originalname || file.filename || ""));
  const safeBase = originalBase.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "motorentix-image";
  const webpFileName = `${safeBase}-${Date.now()}.webp`;
  const webpBuffer = await sharp(file.path, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  if (!hasImageKitConfig()) {
    const localPath = path.join(path.dirname(file.path), webpFileName);
    await fs.writeFile(localPath, webpBuffer);
    fs.unlink(file.path).catch(() => {});
    return `/uploads/${webpFileName}`;
  }

  const imagekit = createClient();
  const uploaded = await imagekit.upload({
    file: webpBuffer,
    fileName: webpFileName,
    folder: process.env.IMAGEKIT_FOLDER || "/motorentix/vehicles",
    useUniqueFileName: true,
    tags: ["motorentix", "vehicle"],
  });

  fs.unlink(file.path).catch(() => {});
  return uploaded.url;
};

export const uploadImageFiles = async (files = []) => {
  const urls = await Promise.all(files.filter(Boolean).map(uploadImageFile));
  return urls.filter(Boolean);
};
