import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = fs.existsSync(path.resolve(".env"))
  ? path.resolve(".env")
  : path.resolve("backend", ".env");

dotenv.config({ path: envPath });

const port = process.env.PORT || 5000;

const start = async () => {
  const { default: app } = await import("./app.js");
  const { default: connectDb } = await import("./config/db.js");
  const { default: seedAdmin } = await import("./utils/seedAdmin.js");

  await connectDb();
  await seedAdmin();
  app.listen(port, () => {
    console.log(`MotoRentix API listening on port ${port}`);
  });
};

start();
