import User from "../models/User.js";

const DEFAULT_ADMIN = {
  name: "Deepak Jadon",
  email: "deepakjadon1907@gmail.com",
  password: "deepakjadon1907@",
  role: "admin",
  status: "active",
};

const seedAdmin = async () => {
  const existing = await User.findOne({ email: DEFAULT_ADMIN.email.toLowerCase() });
  if (existing) {
    let changed = false;
    if (existing.role !== "admin") {
      existing.role = "admin";
      changed = true;
    }
    if (existing.status !== "active") {
      existing.status = "active";
      changed = true;
    }
    if (existing.password !== DEFAULT_ADMIN.password) {
      existing.password = DEFAULT_ADMIN.password;
      changed = true;
    }
    if (changed) {
      await existing.save();
      console.log("Default admin updated");
    }
    return;
  }

  await User.create(DEFAULT_ADMIN);
  console.log("Default admin created");
};

export default seedAdmin;
