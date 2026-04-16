import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminMessage, type AdminUser } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const AdminMessages = () => {
  const token = useAdminStore((s) => s.token);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [messagesData, usersData] = await Promise.all([
        adminApi.listMessages(token),
        adminApi.listUsers(token),
      ]);
      setMessages(messagesData);
      setUsers(usersData);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const sendReply = async (messageId: string) => {
    if (!token) return;
    const reply = replyMap[messageId];
    if (!reply?.trim()) return;
    try {
      await adminApi.replyMessage(token, messageId, reply.trim());
      setReplyMap((m) => ({ ...m, [messageId]: "" }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    }
  };

  const filteredMessages = useMemo(() => {
    if (selectedUserId === "all") return messages;
    return messages.filter((m) => {
      const id = m.userId?._id || m.userId?.id || "";
      return id === selectedUserId;
    });
  }, [messages, selectedUserId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">User inquiries and replies.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-background p-4 h-fit">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-3">Users</p>
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              selectedUserId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            All Messages
          </button>
          <div className="mt-2 space-y-1">
            {users.map((u) => {
              const id = u._id || u.id || "";
              return (
                <button
                  key={id}
                  onClick={() => setSelectedUserId(id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedUserId === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium text-foreground">{u.name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{u.email || ""}</div>
                </button>
              );
            })}
            {users.length === 0 && <p className="text-xs text-muted-foreground">No users yet.</p>}
          </div>
        </aside>

        <div className="space-y-4">
          {filteredMessages.map((m) => (
            <div key={m._id || m.id} className="rounded-2xl border border-border bg-background p-5 space-y-3">
              <div className="text-sm text-muted-foreground">
                {m.userId?.name || "User"} · {m.userId?.email || ""}
              </div>
              <p className="text-foreground">{m.message}</p>
              {m.adminReply && (
                <div className="rounded-lg bg-secondary p-3 text-sm text-foreground">
                  Reply: {m.adminReply}
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Write a reply..."
                  value={replyMap[m._id || m.id] || ""}
                  onChange={(e) => setReplyMap((r) => ({ ...r, [m._id || m.id]: e.target.value }))}
                />
                <button
                  onClick={() => sendReply(m._id || m.id)}
                  className="btn-primary-gradient px-4 py-2 rounded-lg text-primary-foreground font-semibold"
                >
                  Send Reply
                </button>
              </div>
            </div>
          ))}
          {filteredMessages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
