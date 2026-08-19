import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import logo from "@/assets/logo.jpeg";
import bikeHero from "@/assets/hero-bike-2.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email");
      return;
    }
    setLoading(true);
    try {
      const result = await api.requestPasswordResetOtp(email.trim());
      sessionStorage.setItem("motorentix_reset_email", email.trim().toLowerCase());
      if (result.devOtp) {
        toast.info(`Dev OTP: ${result.devOtp}`);
      } else {
        toast.success(result.message || "OTP sent to your registered email");
      }
      navigate("/verify-reset-otp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP");
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
          <h1 className="font-heading text-3xl font-bold text-foreground">Forgot password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your registered user or client email. We will send a verification OTP.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Registered email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-secondary/60 px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          <button disabled={loading} className="btn-primary-gradient w-full rounded-xl py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password? <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
