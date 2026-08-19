import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { User, Mail, Phone, MapPin, Calendar, Hash, IndianRupee, Bookmark, Lock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { api } from "@/lib/api";

const resetTokenKey = "motorentix_password_reset_token";

const Profile = () => {
  const { user, bookings, messages, isAuthenticated, loadProfile, loadBookings, loadMessages, updateProfile } = useStore();
  const token = useStore((state) => state.token);
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    address: "",
    city: "",
    pincode: "",
    aadhaarNumber: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadBookings();
      loadMessages();
    }
  }, [isAuthenticated, loadProfile, loadBookings, loadMessages]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob || "",
        address: user.address || "",
        city: user.city || "",
        pincode: user.pincode || "",
        aadhaarNumber: user.aadhaarNumber || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const storedResetToken = sessionStorage.getItem(resetTokenKey) || "";
    setResetToken(storedResetToken);
    if (searchParams.get("reset") === "password" && storedResetToken) {
      toast.info("Set and save your new password below.");
    }
  }, [searchParams]);

  const firstName = useMemo(() => (user?.name ? user.name.split(" ")[0] : ""), [user?.name]);

  if (!isAuthenticated || !user) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to view profile</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = bookings.reduce(
    (sum, b) => sum + ((b.status === "confirmed" || b.status === "completed") ? b.totalPrice : 0),
    0,
  );

  const handleSave = async () => {
    const result = await updateProfile({
      name: form.name,
      phone: form.phone,
      dob: form.dob,
      address: form.address,
      city: form.city,
      pincode: form.pincode,
      aadhaarNumber: form.aadhaarNumber,
    });

    if (result.ok) {
      toast.success("Profile updated");
      setIsEditing(false);
    } else {
      toast.error(result.message || "Profile update failed");
    }
  };

  const handlePasswordSave = async () => {
    if (!token) return;
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (!resetToken && !passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    try {
      await api.updatePassword(token, {
        currentPassword: resetToken ? undefined : passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        resetToken: resetToken || undefined,
      });
      sessionStorage.removeItem(resetTokenKey);
      setResetToken("");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated. You can now login with the new password.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password update failed");
    }
  };

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, <span className="text-gradient-primary">{firstName}</span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account and view your stats</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bookmark className="text-primary" size={24} />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <p className="font-heading text-2xl font-bold text-foreground">{bookings.length}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <IndianRupee className="text-accent" size={24} />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <p className="font-heading text-2xl font-bold text-foreground">INR {totalSpent}</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-xl font-bold text-foreground">Personal Information</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setForm({
                      name: user.name || "",
                      phone: user.phone || "",
                      dob: user.dob || "",
                      address: user.address || "",
                      city: user.city || "",
                      pincode: user.pincode || "",
                      aadhaarNumber: user.aadhaarNumber || "",
                    });
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary-gradient px-4 py-2 rounded-lg text-primary-foreground text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: User, label: "Name", value: user.name },
                { icon: Mail, label: "Email", value: user.email },
                { icon: Phone, label: "Phone", value: user.phone },
                { icon: Calendar, label: "Date of Birth", value: user.dob },
                { icon: MapPin, label: "Address", value: user.address },
                { icon: MapPin, label: "City", value: user.city },
                { icon: Hash, label: "Pincode", value: user.pincode },
                { icon: Hash, label: "Aadhaar", value: user.aadhaarNumber },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <p className="text-sm font-medium text-foreground">{item.value || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input
                  value={user.email}
                  disabled
                  className="w-full rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Pincode</label>
                <input
                  value={form.pincode}
                  onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Aadhaar Number</label>
                <input
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, aadhaarNumber: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Update Password</h2>
              <p className="text-sm text-muted-foreground">
                {resetToken
                  ? "OTP verified. Enter and save your new password."
                  : "Change your password using your current password."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {!resetToken && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Confirm Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePasswordSave}
            className="btn-primary-gradient mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Save New Password
          </button>
        </motion.div>

        {bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-foreground">Booking History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{b.vehicle.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {b.startDate} to {b.endDate}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {b.createdAt ? b.createdAt.split("T")[0] : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">INR {b.totalPrice}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            b.status === "confirmed"
                              ? "bg-primary/10 text-primary"
                              : b.status === "completed"
                                ? "bg-success/10 text-success"
                                : b.status === "rejected"
                                  ? "bg-destructive/10 text-destructive"
                                : "bg-accent/10 text-accent"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Support Messages</h2>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-border bg-background/80 p-4 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {m.createdAt ? m.createdAt.split("T")[0] : ""}
                    </p>
                    {m.direction === "admin_to_user" && (
                      <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Admin message</span>
                    )}
                  </div>
                  {m.subject && <h3 className="font-heading text-base font-bold text-foreground">{m.subject}</h3>}
                  <p className="text-sm text-foreground">{m.message}</p>
                  {m.adminReply ? (
                    <div className="rounded-lg bg-secondary p-3 text-sm text-foreground">
                      Admin reply: {m.adminReply}
                    </div>
                  ) : m.direction !== "admin_to_user" ? (
                    <p className="text-xs text-muted-foreground">Awaiting admin reply...</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
