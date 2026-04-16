import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { useAdminStore } from "@/store/adminStore";
import { api } from "@/lib/api";

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setUserSessionFromToken = useStore((state) => state.setSessionFromToken);
  const setAdminSession = useAdminStore((state) => state.setSession);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token") || "";
    const role = params.get("role") === "admin" ? "admin" : "user";
    const next = params.get("next") || (role === "admin" ? "/admin" : "/profile");
    const error = params.get("error");

    if (error) {
      toast.error(decodeURIComponent(error));
      navigate(role === "admin" ? "/admin/login" : "/login", { replace: true });
      return;
    }

    if (!token) {
      toast.error("Missing authentication token");
      navigate(role === "admin" ? "/admin/login" : "/login", { replace: true });
      return;
    }

    const finalize = async () => {
      try {
        if (role === "admin") {
          const user = await api.profile(token);
          if (user.role !== "admin") {
            toast.error("Admin access required");
            navigate("/admin/login", { replace: true });
            return;
          }
          setAdminSession(token, {
            id: user.id,
            name: user.name,
            email: user.email,
            role: "admin",
          });
        } else {
          await setUserSessionFromToken(token);
        }
        navigate(next, { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Google sign-in failed";
        toast.error(message);
        navigate(role === "admin" ? "/admin/login" : "/login", { replace: true });
      }
    };

    finalize();
  }, [location.search, navigate, setAdminSession, setUserSessionFromToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing you in with Google...</p>
    </div>
  );
};

export default AuthCallback;
