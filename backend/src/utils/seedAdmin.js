import bcrypt from "bcryptjs";
import User from "../models/User.js";

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed");
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const shouldPromote = existing.role !== "admin";
    const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
    if (!passwordMatches) {
      existing.passwordHash = await bcrypt.hash(password, 10);
    }
    if (shouldPromote) {
      existing.role = "admin";
    }
    if (shouldPromote || !passwordMatches) {
      await existing.save();
      console.log("Existing admin updated");
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: "Deepak Jadon",
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Admin user created");
};

export default seedAdmin;
