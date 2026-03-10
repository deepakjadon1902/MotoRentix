import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const AdminActiveUsersDetail = () => {
  const token = useAdminStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listUsers(token);
      setUsers(data.filter((u) => u.status === "active"));
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Active Users</h1>
        <p className="text-muted-foreground mt-1">Users currently marked as active.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Active Users</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={2}>
                    No active users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminActiveUsersDetail;
