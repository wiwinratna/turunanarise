import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../AppContext";
import { EventData, apiGetEvents, apiCreateEvent, apiUpdateEvent, apiDeleteEvent, apiCheckEventCode } from "../../api";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Check, X, CalendarDays, MapPin, AlertCircle, ToggleLeft, ToggleRight, Info, CheckCircle2, XCircle, Database, Download } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";

const R = 6;

function generateCodeSuggestion(name: string): string {
  if (!name.trim()) return "";
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const yearStr = yearMatch ? yearMatch[1].slice(-2) : new Date().getFullYear().toString().slice(-2);
  
  const words = name.replace(/[0-9]/g, "").split(" ").filter(w => w.trim().length > 0);
  let initials = "";
  if (words.length === 1) {
    initials = words[0].substring(0, 3).toUpperCase();
  } else {
    initials = words.map(w => w[0]).join("").substring(0, 3).toUpperCase();
  }
  return `${initials}${yearStr}`;
}

export function SuperadminEventsPage() {
  const { theme, events, setEvents, currentUser, countries, setPage, setActiveEventId } = useApp();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<EventData>>({});
  
  // Real-time code validation
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [manualCodeEdit, setManualCodeEdit] = useState(false);

  // Debounce check code
  useEffect(() => {
    if (!form.eventCode) {
      setCodeStatus("idle");
      return;
    }
    // If editing and the code hasn't changed from original, it's valid
    if (editId) {
      const originalEvent = events.find(e => e.id === editId);
      if (originalEvent && originalEvent.eventCode === form.eventCode) {
        setCodeStatus("available");
        return;
      }
    }

    const timer = setTimeout(async () => {
      setCodeStatus("checking");
      try {
        const taken = await apiCheckEventCode(form.eventCode!);
        setCodeStatus(taken ? "taken" : "available");
      } catch (e) {
        setCodeStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.eventCode, editId, events]);

  // Auto-generate code when name changes
  useEffect(() => {
    if (!manualCodeEdit && form.name && !editId) {
      const suggestion = generateCodeSuggestion(form.name);
      if (suggestion !== form.eventCode) {
        setForm(f => ({ ...f, eventCode: suggestion }));
      }
    }
  }, [form.name, manualCodeEdit, editId]);

  if (currentUser?.role !== "superadmin") {
    return (
      <div style={{ padding: "60px 28px", textAlign: "center", color: theme.textMutedColor }}>
        <CalendarDays size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: theme.textColor }}>Access Denied</p>
        <p style={{ fontSize: 13 }}>Only Superadmin users can manage Events.</p>
      </div>
    );
  }

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.eventCode?.toLowerCase().includes(search.toLowerCase())
  );

  const closeForm = () => {
    setShowForm(false);
    setManualCodeEdit(false);
    setCodeStatus("idle");
  };

  const openAdd = () => {
    setForm({
      name: "",
      eventCode: "",
      date: "",
      location: "",
      countryId: "",
      description: "",
      active: true,
    });
    setEditId(null);
    setManualCodeEdit(false);
    setShowForm(true);
  };

  const openEdit = (ev: EventData) => {
    setForm({ ...ev });
    setEditId(ev.id);
    setManualCodeEdit(true);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.eventCode) {
      toast.error("Name and Event Code are required.");
      return;
    }
    if (codeStatus === "taken") {
      toast.error("Event Code is already taken! Please change it.");
      return;
    }

    try {
      if (editId) {
        const updated = await apiUpdateEvent(editId, form);
        setEvents(events.map(e => e.id === editId ? updated : e));
        toast.success("Event updated successfully!");
      } else {
        const created = await apiCreateEvent(form);
        setEvents([...events, created]);
        toast.success("Event created successfully!");
      }
      closeForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save event.");
    }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      setDeleteId(null);
      toast.success("Event deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event.");
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.07em", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "9px 12px", color: theme.textColor, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: theme.textColor, margin: 0 }}>Event Management</h2>
          <p style={{ color: theme.textMutedColor, fontSize: 13, margin: "4px 0 0" }}>Create and manage events across the system.</p>
        </div>
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <Plus size={14} /> Create Event
        </button>
      </div>

      <div style={{ borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", gap: 10, borderBottom: `1px solid ${theme.borderColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 300, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "0 12px" }}>
            <Search size={14} style={{ color: theme.textMutedColor }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, flex: 1, padding: "9px 0" }} />
          </div>
          <button 
            onClick={() => {
              const exportData = filtered.map(e => ({
                ID: e.id,
                Name: e.name,
                Code: e.eventCode,
                Date: e.date,
                Location: e.location,
                Status: e.active ? "Active" : "Inactive"
              }));
              exportToCsv(`events_export.csv`, exportData);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: R, background: `${theme.primaryColor}14`, color: theme.primaryColor, border: `1px solid ${theme.primaryColor}40`, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.textMutedColor }}>EVENT NAME</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.textMutedColor }}>CODE</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.textMutedColor }}>DATE</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.textMutedColor }}>STATUS</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: theme.textMutedColor, width: 80 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: theme.textMutedColor, fontSize: 13 }}>No events found.</td></tr>
              )}
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: `1px solid ${theme.borderColor}` }} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textColor }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: theme.textMutedColor, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} /> 
                      {countries.find(c => c.id === e.countryId)?.flag} {e.location || "No location"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontFamily: "monospace", color: theme.primaryColor, fontWeight: 600 }}>{e.eventCode}</td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: theme.textMutedColor }}>{e.date || "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: e.active ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.04)", color: e.active ? "#10b981" : theme.textMutedColor }}>
                      {e.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setActiveEventId(e.id); setPage("master-data"); }} title="Manage Master Data" style={{ width: 28, height: 28, borderRadius: R, background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Database size={13} /></button>
                      <button onClick={() => openEdit(e)} title="Edit Event" style={{ width: 28, height: 28, borderRadius: R, background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteId(e.id)} title="Delete Event" style={{ width: 28, height: 28, borderRadius: R, background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={closeForm}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, width: 440, maxWidth: "90%", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.textColor }}>{editId ? "Edit Event" : "Create Event"}</span>
                <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={18} /></button>
              </div>
              <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>EVENT NAME</label>
                  <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Annual Corporate Summit 2026" style={inputStyle} />
                </div>
                
                <div>
                  <label style={labelStyle}>EVENT CODE (PREFIX)</label>
                  <div style={{ position: "relative" }}>
                    <input value={form.eventCode ?? ""} onChange={e => { setForm(f => ({ ...f, eventCode: e.target.value.toUpperCase() })); setManualCodeEdit(true); }} placeholder="e.g., ACS26" 
                      style={{ ...inputStyle, fontFamily: "monospace", fontSize: 14, fontWeight: 600, borderColor: codeStatus === "taken" ? "#e53e5e" : codeStatus === "available" ? "#10b981" : theme.borderColor }} />
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                      {codeStatus === "checking" && <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${theme.primaryColor}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />}
                      {codeStatus === "available" && <CheckCircle2 size={16} color="#10b981" />}
                      {codeStatus === "taken" && <XCircle size={16} color="#e53e5e" />}
                    </div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, display: "flex", alignItems: "flex-start", gap: 4, color: codeStatus === "taken" ? "#e53e5e" : codeStatus === "available" ? "#10b981" : theme.textMutedColor }}>
                    <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    {codeStatus === "idle" && "Will prefix all Master Data and Participant IDs."}
                    {codeStatus === "checking" && "Checking availability..."}
                    {codeStatus === "available" && "Code is available!"}
                    {codeStatus === "taken" && "Code already taken! Please change it."}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label style={labelStyle}>DATE</label>
                    <input type="date" value={form.date ?? ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>COUNTRY</label>
                    <select value={form.countryId ?? ""} onChange={e => setForm(f => ({ ...f, countryId: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Select Country</option>
                      {countries.filter(c => !c.eventId).map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>LOCATION</label>
                    <input value={form.location ?? ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City or Venue" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>DESCRIPTION</label>
                  <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief details about the event..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: R, border: `1px solid ${theme.borderColor}` }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.textColor, display: "block" }}>Event Active</span>
                    <span style={{ fontSize: 11, color: theme.textMutedColor }}>Admins can only access active events.</span>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.active ? theme.primaryColor : theme.textMutedColor }}>
                    {form.active ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                  </button>
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.borderColor}`, display: "flex", gap: 10 }}>
                <button onClick={closeForm} style={{ flex: 1, padding: "10px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Cancel</button>
                <button onClick={save} disabled={codeStatus === "taken"} style={{ flex: 1, padding: "10px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: codeStatus === "taken" ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: codeStatus === "taken" ? 0.6 : 1 }}>
                  <Check size={14} style={{ display: "inline", marginRight: 6, marginBottom: -2 }} />Save Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, padding: 28, width: 340 }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: R, background: "rgba(229,62,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertCircle size={20} color="#e53e5e" /></div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: theme.textColor, margin: "0 0 4px" }}>Delete Event</p>
                  <p style={{ fontSize: 13, color: theme.textMutedColor, margin: 0 }}>Delete <strong style={{ color: theme.textColor }}>{events.find(e => e.id === deleteId)?.name}</strong>?</p>
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
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
