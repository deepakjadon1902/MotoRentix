import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminMessage, type AdminUser } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

type Audience = "selected" | "users" | "collective";
const PAGE_SIZE = 10;

const userIdOf = (user: AdminUser) => user._id || user.id || "";

const AdminMessages = () => {
  const token = useAdminStore((s) => s.token);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [audience, setAudience] = useState<Audience>("collective");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

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

  const customers = useMemo(() => users.filter((u) => u.role === "user"), [users]);
  const collectiveRecipients = useMemo(() => users.filter((u) => u.role !== "admin"), [users]);
  const selectableRecipients = useMemo(
    () => collectiveRecipients.length ? collectiveRecipients : users.filter((u) => u.role !== "admin"),
    [collectiveRecipients, users],
  );

  const previewRecipients = audience === "users"
      ? customers
      : audience === "collective"
        ? collectiveRecipients
        : users.filter((user) => recipientIds.includes(userIdOf(user)));

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

  const changeAudience = (next: Audience) => {
    setAudience(next);
    setNotice("");
    if (next !== "selected") setRecipientIds([]);
  };

  const toggleRecipient = (id: string) => {
    setRecipientIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const sendAdminMessage = async () => {
    if (!token) return;
    if (!body.trim()) {
      setError("Write a message before sending");
      return;
    }
    if (audience === "selected" && recipientIds.length === 0) {
      setError("Select at least one recipient");
      return;
    }
    setSending(true);
    try {
      const result = await adminApi.sendAdminMessage(token, {
        audience,
        recipientIds: audience === "selected" ? recipientIds : undefined,
        subject: subject.trim(),
        message: body.trim(),
      });
      setSubject("");
      setBody("");
      setRecipientIds([]);
      setNotice(`Message sent to ${result.count} recipient${result.count === 1 ? "" : "s"}.`);
      setError("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (selectedUserId === "all") return messages;
    return messages.filter((m) => {
      const id = m.userId?._id || m.userId?.id || "";
      return id === selectedUserId;
    });
  }, [messages, selectedUserId]);

  const pagedMessages = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMessages.slice(start, start + PAGE_SIZE);
  }, [filteredMessages, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedUserId]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filteredMessages.length, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Send messages to riders, everyone, or a particular recipient.</p>
      </div>

      {notice && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Super admin broadcast</p>
            <h2 className="font-heading mt-1 text-2xl font-bold text-foreground">Send message</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the audience, write the message, then send.</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm">
            <span className="font-bold text-foreground">{previewRecipients.length}</span>
            <span className="ml-1 text-muted-foreground">recipients</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {([
            ["users", "Riders", `${customers.length} customers`],
            ["collective", "Everyone", `${collectiveRecipients.length} recipients`],
            ["selected", "Particular", `${recipientIds.length} selected`],
          ] as [Audience, string, string][]).map(([value, label, helper]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeAudience(value)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                audience === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <span className="block text-sm font-bold">{label}</span>
              <span className={`mt-1 block text-xs ${audience === value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{helper}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {audience === "selected" ? "Select recipients" : "Recipients preview"}
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {(audience === "selected" ? selectableRecipients : previewRecipients).map((user) => {
                const id = userIdOf(user);
                const checked = recipientIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => audience === "selected" && toggleRecipient(id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      audience === "selected" && checked ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{user.name || "User"}</span>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        {user.role === "owner" ? "staff" : user.role || "user"}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{user.email || ""}</div>
                  </button>
                );
              })}
              {(audience === "selected" ? selectableRecipients : previewRecipients).length === 0 && (
                <p className="text-sm text-muted-foreground">No recipients found.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Subject, e.g. Payment gateway update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="min-h-40 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write message for selected audience..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Messages are saved in each recipient profile and emailed if mail delivery is configured.</p>
              <button
                type="button"
                onClick={sendAdminMessage}
                disabled={sending}
                className="btn-primary-gradient rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-background p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">History</p>
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              selectedUserId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            All Messages
          </button>
          <div className="mt-2 space-y-1">
            {users.map((u) => {
              const id = userIdOf(u);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedUserId(id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
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
          {pagedMessages.map((m) => (
            <div key={m._id || m.id} className="space-y-3 rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="text-sm text-muted-foreground">
                  {m.userId?.name || "User"} - {m.userId?.email || ""}
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                  m.direction === "admin_to_user" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {m.direction === "admin_to_user" ? `Admin sent (${m.audience || "selected"})` : "User inquiry"}
                </span>
              </div>
              {m.subject && <h3 className="font-heading text-lg font-bold text-foreground">{m.subject}</h3>}
              <p className="whitespace-pre-wrap text-foreground">{m.message}</p>
              {m.adminReply && (
                <div className="rounded-lg bg-secondary p-3 text-sm text-foreground">
                  Reply: {m.adminReply}
                </div>
              )}
              {m.direction !== "admin_to_user" && (
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Write a reply..."
                    value={replyMap[m._id || m.id] || ""}
                    onChange={(e) => setReplyMap((r) => ({ ...r, [m._id || m.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => sendReply(m._id || m.id)}
                    className="btn-primary-gradient rounded-lg px-4 py-2 font-semibold text-primary-foreground"
                  >
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredMessages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
          {filteredMessages.length > 0 && (
            <AdminPagination page={page} total={filteredMessages.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
