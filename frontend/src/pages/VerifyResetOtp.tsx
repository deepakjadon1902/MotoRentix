import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import logo from "@/assets/logo.jpeg";
import bikeHero from "@/assets/hero-bike-1.jpg";

const resetTokenKey = "motorentix_password_reset_token";

const VerifyResetOtp = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const setSessionFromToken = useStore((state) => state.setSessionFromToken);
  const navigate = useNavigate();

  useEffect(() => {
    setEmail(sessionStorage.getItem("motorentix_reset_email") || "");
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !otp.trim()) {
      toast.error("Please enter email and OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await api.verifyPasswordResetOtp({ email: email.trim(), otp: otp.trim() });
      sessionStorage.setItem(resetTokenKey, result.resetToken);
      await setSessionFromToken(result.token);
      toast.success("OTP verified. Please set your new password.");
      navigate("/profile?reset=password");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-padding relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary">
      <div className="absolute inset-0">
        <img src={bikeHero} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/95" />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass relative z-10 w-full max-w-md rounded-3xl border border-border/60 bg-background/85 p-8">
        <img src={logo} alt="MotoRentix" className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-border/70" />
        <div className="mt-5 text-center">
          <h1 className="font-heading text-3xl font-bold text-foreground">Verify OTP</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit OTP sent to your registered email.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">OTP</span>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="w-full rounded-xl border border-border bg-secondary/60 px-10 py-3 text-center font-heading text-xl tracking-[0.35em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          <button disabled={loading} className="btn-primary-gradient w-full rounded-xl py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need a new OTP? <Link to="/forgot-password" className="font-medium text-primary hover:underline">Send again</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyResetOtp;
