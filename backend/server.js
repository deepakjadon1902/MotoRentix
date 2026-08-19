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
  const { default: seedSubscriptionPlans } = await import("./utils/seedSubscriptionPlans.js");
  const { runSubscriptionAutomation } = await import("./utils/subscriptionLifecycle.js");

  await connectDb();
  await seedAdmin();
  await seedSubscriptionPlans();
  await runSubscriptionAutomation();
  setInterval(() => {
    runSubscriptionAutomation().catch((error) => {
      console.warn("Subscription automation failed:", error.message);
    });
  }, 1000 * 60 * 60);
  app.listen(port, () => {
    console.log(`MotoRentix API listening on port ${port}`);
  });
};

start();
