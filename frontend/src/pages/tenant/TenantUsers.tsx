import { useEffect, useState } from "react";
import { tenantApi, type TenantSettings, type TenantUserBundle } from "@/lib/tenantApi";
import { useStore } from "@/store/useStore";

const TenantUsers = () => {
  const token = useStore((state) => state.token);
  const [data, setData] = useState<TenantUserBundle>({ customers: [], staff: [] });
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    tenantApi.users(token).then(setData).catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"));
    tenantApi.settings(token).then(setSettings).catch(() => setSettings(null));
  }, [token]);

  const features = settings?.entitlements?.features || {};
  const canViewStaff = Boolean(features.staffManagement || features.rolePermissions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">Customers and staff inside your company workspace.</p>
      </div>
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className={`grid grid-cols-1 gap-6 ${canViewStaff ? "xl:grid-cols-2" : ""}`}>
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border font-heading font-bold">Customers</div>
          <div className="divide-y divide-border">
            {data.customers.map((user) => <div key={user._id || user.id} className="p-4"><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email || "-"} - {user.phone || "-"}</p></div>)}
            {data.customers.length === 0 && <p className="p-6 text-muted-foreground">No customers yet.</p>}
          </div>
        </section>
        {canViewStaff && <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border font-heading font-bold">Staff</div>
          <div className="divide-y divide-border">
            {data.staff.map((user) => <div key={user._id || user.id} className="p-4"><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.role} - {user.email || "-"} - {user.status}</p></div>)}
            {data.staff.length === 0 && <p className="p-6 text-muted-foreground">No staff yet.</p>}
          </div>
        </section>}
      </div>
    </div>
  );
};

export default TenantUsers;
