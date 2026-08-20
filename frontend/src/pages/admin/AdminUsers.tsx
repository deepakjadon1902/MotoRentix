import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const AdminUsers = () => {
  const token = useAdminStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listUsers(token);
      setUsers(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (userId: string, current: string) => {
    if (!token) return;
    const next = current === "active" ? "blocked" : "active";
    try {
      await adminApi.updateUserStatus(token, userId, next as "active" | "blocked");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [page, users]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, users.length]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">View and manage user access.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">User List</div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Address</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Aadhaar</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u._id || u.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.phone || "-"}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {(u.address || u.city || u.pincode)
                      ? `${u.address || ""}${u.city ? `, ${u.city}` : ""}${u.pincode ? ` - ${u.pincode}` : ""}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.aadhaarNumber || "-"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.status === "active" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => toggleStatus(u._id || u.id, u.status)}
                        className="px-4 py-2 rounded-lg border border-border text-foreground"
                      >
                        {u.status === "active" ? "Block" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border lg:hidden">
          {pagedUsers.map((u) => (
            <article key={u._id || u.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{u.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email || "-"}</p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${u.status === "active" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                  {u.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <p>Phone: <span className="font-semibold text-foreground">{u.phone || "-"}</span></p>
                <p>Role: <span className="font-semibold text-foreground">{u.role || "-"}</span></p>
                <p>Aadhaar: <span className="font-semibold text-foreground">{u.aadhaarNumber || "-"}</span></p>
                <p>
                  Address: {(u.address || u.city || u.pincode)
                    ? `${u.address || ""}${u.city ? `, ${u.city}` : ""}${u.pincode ? ` - ${u.pincode}` : ""}`
                    : "-"}
                </p>
              </div>
              {u.role !== "admin" && (
                <button
                  onClick={() => toggleStatus(u._id || u.id, u.status)}
                  className="mt-3 w-full rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary"
                >
                  {u.status === "active" ? "Block" : "Activate"}
                </button>
              )}
            </article>
          ))}
          {users.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users found.</div>}
        </div>
      </div>

      <AdminPagination page={page} total={users.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AdminUsers;
