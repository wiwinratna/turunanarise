import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../AppContext";
import { AuthUser, apiCreateUser, apiUpdateUser, apiDeleteUser } from "../../api";
import { toast } from "sonner";
import {
  Search, Edit2, Trash2, Check, X, Shield, ShieldCheck,
  ChevronUp, ChevronDown, AlertCircle, ToggleLeft, ToggleRight,
  UserPlus, Users, Eye, EyeOff, RefreshCw, Copy
} from "lucide-react";

function generatePassword(len = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let pw = "";
  for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const R = 6;

type SortDir = "asc" | "desc";

function useSort<T>(data: T[], key: keyof T) {
  const [col, setCol] = useState<keyof T>(key);
  const [dir, setDir] = useState<SortDir>("asc");
  const toggle = (c: keyof T) => { if (c === col) setDir(d => d === "asc" ? "desc" : "asc"); else { setCol(c); setDir("asc"); } };
  const sorted = [...data].sort((a, b) => {
    const av = String(a[col]).toLowerCase(), bv = String(b[col]).toLowerCase();
    return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return { sorted, col, dir, toggle };
}

function ThCol({ label, field, col, dir, onToggle }: { label: string; field: string; col: string; dir: SortDir; onToggle: () => void }) {
  const active = col === field;
  const { theme } = useApp();
  return (
    <th onClick={onToggle} style={{
      padding: "10px 14px", textAlign: "left", cursor: "pointer", userSelect: "none",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: active ? theme.textColor : theme.textMutedColor,
      background: "none", border: "none", whiteSpace: "nowrap"
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        <span style={{ display: "inline-flex", flexDirection: "column", opacity: active ? 1 : 0.3 }}>
          <ChevronUp size={9} style={{ marginBottom: -2, color: active && dir === "asc" ? theme.primaryColor : undefined }} />
          <ChevronDown size={9} style={{ color: active && dir === "desc" ? theme.primaryColor : undefined }} />
        </span>
      </span>
    </th>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const { theme } = useApp();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: active ? "rgba(16,185,129,0.12)" : theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      color: active ? "#10b981" : theme.textMutedColor,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#10b981" : theme.textMutedColor, display: "inline-block" }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

interface MultiSelectEventsProps {
  events: any[];
  selectedEventIds: string[];
  onChange: (ids: string[]) => void;
  theme: any;
}

function MultiSelectEvents({ events, selectedEventIds, onChange, theme }: MultiSelectEventsProps) {
  const [open, setOpen] = useState(false);

  const toggleId = (id: string) => {
    if (selectedEventIds.includes(id)) {
      onChange(selectedEventIds.filter(x => x !== id));
    } else {
      onChange([...selectedEventIds, id]);
    }
  };

  const selectedNames = events
    .filter(e => selectedEventIds.includes(e.id))
    .map(e => e.name)
    .join(", ");

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: theme.inputColor,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 6,
          padding: "10px 12px",
          color: selectedEventIds.length > 0 ? theme.textColor : theme.textMutedColor,
          fontSize: 13,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
          {selectedEventIds.length > 0 ? selectedNames : "— Select events —"}
        </span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: theme.cardColor,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: 6,
              marginTop: 4,
              maxHeight: 180,
              overflowY: "auto",
              zIndex: 50,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              boxSizing: "border-box",
            }}
          >
            {events.map(ev => {
              const isChecked = selectedEventIds.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  onClick={() => toggleId(ev.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: isChecked ? `${theme.primaryColor}15` : "transparent",
                    transition: "background 0.15s",
                  }}
                  className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    style={{ accentColor: theme.primaryColor, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: isChecked ? theme.textColor : theme.textMutedColor, fontWeight: isChecked ? 600 : 400 }}>
                    {ev.name}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function UsersPage() {
  const { theme, users, setUsers, events, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"admin" | "superadmin">("admin");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AuthUser> & { password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  // Only superadmin can access this page
  if (currentUser?.role !== "superadmin") {
    return (
      <div style={{ padding: "60px 28px", textAlign: "center", color: theme.textMutedColor }}>
        <Shield size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: theme.textColor }}>Access Denied</p>
        <p style={{ fontSize: 13 }}>Only Superadmin users can manage the team.</p>
      </div>
    );
  }

  // Filter users by role according to active tab
  const roleFiltered = users.filter(u => u.role === activeTab);

  // Filter users by search
  const filtered = roleFiltered.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  const closeForm = () => {
    setShowForm(false);
    setShowPassword(false);
    setGeneratedPassword(null);
  };

  const openAdd = () => {
    setForm({
      role: activeTab,
      active: true,
      eventId: activeTab === "admin" ? [] : null,
      password: "",
    });
    setEditId(null);
    setShowPassword(false);
    setGeneratedPassword(null);
    setShowForm(true);
  };

  const openEdit = (u: AuthUser) => {
    const eventIds = u.role === "admin"
      ? (Array.isArray(u.eventId) ? u.eventId : (u.eventId ? [u.eventId] : []))
      : null;
    setForm({ ...u, eventId: eventIds, password: "" });
    setEditId(u.id);
    setShowPassword(false);
    setGeneratedPassword(null);
    setShowForm(true);
  };

  const handleGenerate = () => {
    const pw = generatePassword(12);
    setForm(f => ({ ...f, password: pw }));
    setGeneratedPassword(pw);
    setShowPassword(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Password copied to clipboard!"));
  };

  const save = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and Email are required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!editId && (!form.password || form.password.length < 6)) {
      toast.error("Password is required and must be at least 6 characters");
      return;
    }

    if (editId && form.password && form.password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (form.role === "admin") {
      const selectedEvents = Array.isArray(form.eventId) ? form.eventId : [];
      if (selectedEvents.length === 0) {
        toast.error("Please assign at least one event to the Admin");
        return;
      }
    }

    try {
      if (editId) {
        const payload: Partial<AuthUser> & { password?: string } = {
          name: form.name,
          email: form.email,
          role: form.role,
          eventId: form.eventId,
          active: form.active,
        };
        if (form.password) {
          payload.password = form.password;
        }

        const updated = await apiUpdateUser(editId, payload);
        setUsers(users.map(u => u.id === editId ? updated : u));
        toast.success("User updated successfully");
      } else {
        const created = await apiCreateUser(form);
        setUsers([...users, created]);
        toast.success("User created successfully");
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setDeleteId(null);
      toast.success("User deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const getEventNames = (eventId: string | string[] | null) => {
    if (!eventId) return "—";
    const ids = Array.isArray(eventId) ? eventId : [eventId];
    if (ids.length === 0) return "—";
    const names = ids.map(id => events.find(e => e.id === id)?.name).filter(Boolean);
    if (names.length === 0) return "—";
    return names.join(", ");
  };

  const stats = [
    { label: "Total Users", value: users.length, color: theme.primaryColor, icon: <Users size={16} /> },
    { label: "Superadmins", value: users.filter(u => u.role === "superadmin").length, color: "#a08cfc", icon: <ShieldCheck size={16} /> },
    { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "#10b981", icon: <Shield size={16} /> },
  ];

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.07em", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "9px 12px", color: theme.textColor, fontSize: 13, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}` }}>
            <div style={{ width: 34, height: 34, borderRadius: R, background: `${s.color}18`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.textColor, fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: theme.textMutedColor }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Container */}
      <div style={{ borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, overflow: "hidden" }}>
        {/* Tab Bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${theme.borderColor}` }}>
          {[
            { id: "admin" as const, label: "Admins", count: users.filter(u => u.role === "admin").length },
            { id: "superadmin" as const, label: "Superadmins", count: users.filter(u => u.role === "superadmin").length }
          ].map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSearch(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "13px 22px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                color: activeTab === t.id ? theme.primaryColor : theme.textMutedColor,
                borderBottom: activeTab === t.id ? `2px solid ${theme.primaryColor}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                background: activeTab === t.id ? `${theme.primaryColor}25` : theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                color: activeTab === t.id ? theme.primaryColor : theme.textMutedColor,
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Action Bar */}
        <div style={{ display: "flex", gap: 10, padding: "16px 20px", flexWrap: "wrap", borderBottom: `1px solid ${theme.borderColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "0 12px" }}>
            <Search size={14} style={{ color: theme.textMutedColor, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}s…`}
              style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, flex: 1, padding: "9px 0" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={12} /></button>}
          </div>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            <UserPlus size={14} /> Add {activeTab === "admin" ? "Admin" : "Superadmin"}
          </button>
        </div>

        {/* User Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                <th style={{ padding: "10px 14px", width: 40 }} />
                <ThCol label="NAME" field="name" col={col as string} dir={dir} onToggle={() => toggle("name")} />
                <ThCol label="EMAIL" field="email" col={col as string} dir={dir} onToggle={() => toggle("email")} />
                {activeTab === "admin" && (
                  <th style={{ padding: "10px 14px", color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textAlign: "left" }}>ASSIGNED EVENTS</th>
                )}
                <ThCol label="STATUS" field="active" col={col as string} dir={dir} onToggle={() => toggle("active")} />
                <th style={{ padding: "10px 14px", width: 90, color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={activeTab === "admin" ? 6 : 5} style={{ padding: 40, textAlign: "center", color: theme.textMutedColor, fontSize: 13 }}>No users found</td></tr>
              )}
              {sorted.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: `1px solid ${theme.borderColor}` }} className="table-row-hover">
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                      <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: theme.textColor }}>{u.name}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: theme.textMutedColor }}>{u.email}</td>
                  {activeTab === "admin" && (
                    <td style={{ padding: "11px 14px", fontSize: 12, color: theme.textMutedColor }}>{getEventNames(u.eventId)}</td>
                  )}
                  <td style={{ padding: "11px 14px" }}><StatusPill active={u.active} /></td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEdit(u)} style={{ width: 30, height: 30, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer" }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(u.id)} style={{ width: 30, height: 30, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Panel Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex justify-end"
            style={{ background: "rgba(0,0,0,0.55)" }} onClick={closeForm}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 400, height: "100%", background: theme.sidebarColor, borderLeft: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${theme.borderColor}` }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: theme.textColor }}>{editId ? `Edit ${activeTab === "admin" ? "Admin" : "Superadmin"}` : `Add ${activeTab === "admin" ? "Admin" : "Superadmin"}`}</span>
                <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, display: "flex" }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" style={inputStyle} />
                </div>

                {/* ── Password Field ── */}
                <div>
                  <label style={labelStyle}>PASSWORD</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {/* input + show/hide */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password ?? ""}
                        onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setGeneratedPassword(null); }}
                        placeholder={editId ? "Leave blank to keep current" : "Min. 6 characters"}
                        style={{ ...inputStyle, paddingRight: 36, fontFamily: showPassword ? "inherit" : "monospace" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        title={showPassword ? "Hide password" : "Show password"}
                        style={{
                          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: theme.textMutedColor, display: "flex", padding: 0,
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {/* Generate button */}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      title="Generate random password"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "0 12px", borderRadius: R,
                        background: `${theme.primaryColor}18`,
                        color: theme.primaryColor,
                        border: `1px solid ${theme.primaryColor}40`,
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      <RefreshCw size={12} />
                      Generate
                    </button>
                  </div>

                  {/* Generated password notice */}
                  {generatedPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: 8, padding: "10px 12px",
                        background: `${theme.primaryColor}10`,
                        border: `1px dashed ${theme.primaryColor}50`,
                        borderRadius: R, display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: theme.primaryColor, letterSpacing: "0.07em", marginBottom: 2 }}>GENERATED PASSWORD</div>
                        <code style={{ fontSize: 13, color: theme.textColor, fontFamily: "monospace", wordBreak: "break-all" }}>{generatedPassword}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedPassword)}
                        title="Copy to clipboard"
                        style={{ background: "none", border: "none", cursor: "pointer", color: theme.primaryColor, flexShrink: 0, display: "flex" }}
                      >
                        <Copy size={14} />
                      </button>
                    </motion.div>
                  )}

                  {editId && !generatedPassword && (
                    <span style={{ fontSize: 11, color: theme.textMutedColor, marginTop: 4, display: "block" }}>
                      Leave blank to keep current password
                    </span>
                  )}
                </div>

                {form.role === "admin" && (
                  <div>
                    <label style={labelStyle}>ASSIGNED EVENT(S)</label>
                    <MultiSelectEvents
                      events={events}
                      selectedEventIds={Array.isArray(form.eventId) ? form.eventId : []}
                      onChange={ids => setForm(f => ({ ...f, eventId: ids }))}
                      theme={theme}
                    />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: R, border: `1px solid ${theme.borderColor}` }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: theme.textColor }}>Active</span>
                  <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.active ? theme.primaryColor : theme.textMutedColor }}>
                    {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: theme.textMutedColor }} />}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                  <button onClick={closeForm} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  <button onClick={save} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <Check size={13} style={{ display: "inline", marginRight: 4 }} />Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, padding: 28, width: 340 }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: R, background: "rgba(229,62,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertCircle size={20} style={{ color: "#e53e5e" }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: theme.textColor, margin: "0 0 4px" }}>Delete User</p>
                  <p style={{ fontSize: 13, color: theme.textMutedColor, margin: 0 }}>Remove <strong style={{ color: theme.textColor }}>{users.find(u => u.id === deleteId)?.name}</strong>? This cannot be undone.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Cancel</button>
                <button onClick={() => del(deleteId)} style={{ flex: 1, padding: "9px 0", borderRadius: R, background: "#e53e5e", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.table-row-hover:hover { background: ${theme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"}; }`}</style>
    </div>
  );
}
