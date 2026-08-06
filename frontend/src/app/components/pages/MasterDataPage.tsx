import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, MasterCategory, MasterFunction, MasterCountry } from "../AppContext";
import {
  apiCreateCategory, apiUpdateCategory, apiDeleteCategory,
  apiCreateFunction, apiUpdateFunction, apiDeleteFunction,
  apiCreateCountry, apiUpdateCountry, apiDeleteCountry,
  ParticipantData, apiDeleteParticipant, apiUpdateParticipant,
  apiGetEventLayout
} from "../../api";
import { WORLD_COUNTRIES } from "../../utils/countriesList";
import { toast } from "sonner";
import {
  Search, Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown,
  Tag, Briefcase, Globe, ToggleLeft, ToggleRight, AlertCircle, Users,
  Eye, Download, Pencil, MessageCircle, Loader2
} from "lucide-react";
import { WhatsAppDialog } from "../WhatsAppDialog";
import { CardPreviewDialog } from "../CardPreviewDialog";
import { downloadCardPDF } from "../../utils/downloadCard";

// ─── shared UI helpers ────────────────────────────────────────────────────────
const R = 6; // base corner radius (px)

function Pill({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 4,
      background: active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)",
      color: active ? "#10b981" : "#7070a0",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#10b981" : "#7070a0", display: "inline-block" }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

type SortDir = "asc" | "desc";

function useSort<T>(data: T[], key: keyof T) {
  const [col, setCol] = useState<keyof T>(key);
  const [dir, setDir] = useState<SortDir>("asc");
  const toggle = (c: keyof T) => { if (c === col) setDir(d => d === "asc" ? "desc" : "asc"); else { setCol(c); setDir("asc"); } };
  const sorted = [...data].sort((a, b) => {
    const av = String(a[col] || "").toLowerCase(), bv = String(b[col] || "").toLowerCase();
    return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return { sorted, col, dir, toggle };
}

function ThCol({ label, field, col, dir, onToggle }: { label: string; field: string; col: string; dir: SortDir; onToggle: () => void }) {
  const active = col === field;
  return (
    <th onClick={onToggle} style={{
      padding: "10px 14px", textAlign: "left", cursor: "pointer", userSelect: "none",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: active ? "#c8c8e8" : "#7070a0",
      background: "none", border: "none", whiteSpace: "nowrap"
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        <span style={{ display: "inline-flex", flexDirection: "column", opacity: active ? 1 : 0.3 }}>
          <ChevronUp size={9} style={{ marginBottom: -2, color: active && dir === "asc" ? "#7c5cfc" : undefined }} />
          <ChevronDown size={9} style={{ color: active && dir === "desc" ? "#7c5cfc" : undefined }} />
        </span>
      </span>
    </th>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, theme }: { name: string; onConfirm: () => void; onCancel: () => void; theme: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }} onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, padding: 28, width: 340 }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: R, background: "rgba(229,62,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={20} style={{ color: "#e53e5e" }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.textColor, margin: "0 0 4px" }}>Delete Record</p>
            <p style={{ fontSize: 13, color: theme.textMutedColor, margin: 0 }}>Remove <strong style={{ color: theme.textColor }}>{name}</strong>? This cannot be undone.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "9px 0", borderRadius: R, background: "#e53e5e", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── COUNTRIES TAB ────────────────────────────────────────────────────────────
function CountriesTab({ theme }: { theme: any }) {
  const { countries, setCountries, activeEventId } = useApp();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState<Partial<MasterCountry>>({});

  const filtered = countries.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.gymCode || "").toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  const openAdd = () => { 
    setForm({ active: true, flag: "", code: "", gymCode: "", name: "" }); 
    setEditId(null); 
    setShowForm(true); 
  };
  const openEdit = (c: MasterCountry) => { setForm(c); setEditId(c.id); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.code) {
      toast.error("Code and Name are required");
      return;
    }
    try {
      if (editId) {
        const updated = await apiUpdateCountry(editId, form);
        setCountries(countries.map(c => c.id === editId ? updated : c));
        toast.success("Country updated");
      } else {
        const newCo = { ...form, id: form.code, flag: form.code, eventId: activeEventId || undefined }; // Use code as ID and fallback flag
        const created = await apiCreateCountry(newCo);
        setCountries([...countries, created]);
        toast.success("Country created");
      }
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save country");
    }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteCountry(id);
      setCountries(countries.filter(c => c.id !== id));
      setDeleteId(null);
      toast.success("Country deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete country");
    }
  };

  return (
    <div>
      <Toolbar search={search} onSearch={setSearch} onAdd={openAdd} theme={theme} placeholder="Search countries…" addLabel="Add Country" />
      <TableWrap>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <th style={{ padding: "10px 14px", color: "#7070a0", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", width: 50 }}>FLAG</th>
            <ThCol label="CODE" field="code" col={col as string} dir={dir} onToggle={() => toggle("code")} />
            <ThCol label="GYM CODE" field="gymCode" col={col as string} dir={dir} onToggle={() => toggle("gymCode")} />
            <ThCol label="COUNTRY NAME" field="name" col={col as string} dir={dir} onToggle={() => toggle("name")} />
            <ThCol label="STATUS" field="active" col={col as string} dir={dir} onToggle={() => toggle("active")} />
            <th style={{ padding: "10px 14px", width: 90, color: "#7070a0", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && <EmptyRow cols={6} />}
          {sorted.map((c, i) => (
            <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="table-row-hover">
              <Td>
                <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} style={{ width: 28, height: 20, borderRadius: 2, display: "block", objectFit: "cover" }} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </Td>
              <Td><CodeBadge>{c.code}</CodeBadge></Td>
              <Td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: theme.textMutedColor }}>{c.gymCode}</Td>
              <Td><span style={{ fontWeight: 600, color: theme.textColor }}>{c.name}</span></Td>
              <Td><Pill active={c.active} /></Td>
              <Td><RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} theme={theme} /></Td>
            </motion.tr>
          ))}
        </tbody>
      </TableWrap>
      <AnimatePresence>
        {showForm && (
          <SlidePanel title={editId ? "Edit Country" : "Add Country"} onClose={() => setShowForm(false)} theme={theme}>
            <div>
              <label style={labelStyle(theme)}>COUNTRY NAME</label>
              <div style={{ position: "relative" }}>
                <input 
                  value={form.name ?? ""}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. Indonesia"
                  style={inputStyle(theme)}
                />
                {showSuggestions && (form.name || "").length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: theme.isDark ? "#1a1a24" : "#ffffff", border: `1px solid ${theme.borderColor}`, zIndex: 10, maxHeight: 180, overflowY: "auto", borderRadius: 4, marginTop: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {(WORLD_COUNTRIES || []).filter(c => c.name.toLowerCase().includes((form.name || "").toLowerCase())).map(c => (
                      <div 
                        key={c.code}
                        onClick={() => {
                          setForm(f => ({ ...f, name: c.name, code: c.code, gymCode: `GYM-${c.code}` }));
                          setShowSuggestions(false);
                        }}
                        style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${theme.borderColor}` }}
                        className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      >
                        <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2 }} />
                        <span style={{ fontSize: 13, color: theme.textColor }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: theme.textMutedColor, marginLeft: "auto" }}>{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <Field label="Country Code (ISO)" value={form.code ?? ""} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="e.g. ID" disabled={!!editId} />
            <Field label="Gym Code" value={form.gymCode ?? ""} onChange={v => setForm(f => ({ ...f, gymCode: v }))} placeholder="e.g. GYM-ID" />
            <ActiveToggle value={!!form.active} onChange={v => setForm(f => ({ ...f, active: v }))} theme={theme} />
            <PanelActions onSave={save} onCancel={() => setShowForm(false)} theme={theme} />
          </SlidePanel>
        )}
        {deleteId && (
          <DeleteModal name={countries.find(c => c.id === deleteId)?.name ?? ""} onConfirm={() => del(deleteId)} onCancel={() => setDeleteId(null)} theme={theme} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
const labelStyle = (theme: any): React.CSSProperties => ({ fontSize: 11, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.07em", display: "block", marginBottom: 6 });
const inputStyle = (theme: any): React.CSSProperties => ({ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "9px 12px", color: theme.textColor, fontSize: 13, outline: "none", boxSizing: "border-box" });
const selectStyle = (theme: any): React.CSSProperties => ({ ...inputStyle(theme), cursor: "pointer" });

function Field({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const { theme } = useApp();
  return (
    <div>
      <label style={labelStyle(theme)}>{label.toUpperCase()}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ ...inputStyle(theme), opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : undefined }} />
    </div>
  );
}

function ActiveToggle({ value, onChange, theme }: { value: boolean; onChange: (v: boolean) => void; theme: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: R, border: `1px solid ${theme.borderColor}` }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: theme.textColor }}>Active</span>
      <button onClick={() => onChange(!value)} style={{ background: "none", border: "none", cursor: "pointer", color: value ? theme.primaryColor : theme.textMutedColor }}>
        {value ? <ToggleRight size={26} /> : <ToggleLeft size={26} style={{ color: theme.textMutedColor }} />}
      </button>
    </div>
  );
}

function PanelActions({ onSave, onCancel, theme }: { onSave: () => void; onCancel: () => void; theme: any }) {
  return (
    <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>Cancel</button>
      <button onClick={onSave} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        <Check size={13} style={{ display: "inline", marginRight: 4 }} />Save
      </button>
    </div>
  );
}

function Toolbar({ search, onSearch, onAdd, theme, placeholder, addLabel, hideAdd }: {
  search: string; onSearch: (v: string) => void; onAdd: () => void; theme: any; placeholder: string; addLabel: string; hideAdd?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "0 12px" }}>
        <Search size={14} style={{ color: theme.textMutedColor, flexShrink: 0 }} />
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
          style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, flex: 1, padding: "9px 0" }} />
        {search && <button onClick={() => onSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={12} /></button>}
      </div>
      {!hideAdd && (
        <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          <Plus size={14} />{addLabel}
        </button>
      )}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "6px 14px", fontSize: 13, verticalAlign: "middle", ...style }}>{children}</td>;
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr><td colSpan={cols} style={{ padding: "40px", textAlign: "center", color: "#7070a0", fontSize: 13 }}>No records found</td></tr>
  );
}

function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, background: "rgba(124,92,252,0.12)", color: "#a08cfc", borderRadius: 4, padding: "2px 8px" }}>
      {children}
    </span>
  );
}

function CategoryChip({ name, theme }: { name: string; theme: any }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: `${theme.primaryColor}14`, color: theme.primaryColor, borderRadius: 4, padding: "2px 8px" }}>
      {name}
    </span>
  );
}

function RowActions({ onEdit, onDelete, theme }: { onEdit: () => void; onDelete: () => void; theme: any }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer" }}>
        <Edit2 size={13} />
      </button>
      <button onClick={onDelete} style={{ width: 30, height: 30, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer" }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function SlidePanel({ title, onClose, theme, children }: { title: string; onClose: () => void; theme: any; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex justify-end"
      style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ width: 360, height: "100%", background: theme.sidebarColor, borderLeft: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${theme.borderColor}` }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: theme.textColor }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── CATEGORIES TAB ────────────────────────────────────────────────────────────
function CategoriesTab({ theme }: { theme: any }) {
  const { categories, setCategories, activeEventId, events } = useApp();
  const currentEvent = events.find(e => e.id === activeEventId);
  const prefix = currentEvent ? currentEvent.eventCode + "-" : "";
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<MasterCategory>>({});

  const filtered = categories.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  const openAdd = () => {
    const nextNum = categories.length + 1;
    const autoCode = `${prefix}CAT-${String(nextNum).padStart(3, "0")}`;
    setForm({ active: true, code: autoCode }); 
    setEditId(null); 
    setShowForm(true); 
  };
  const openEdit = (c: MasterCategory) => { setForm(c); setEditId(c.id); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.code) return toast.error("Please fill name and code");
    try {
      if (editId) {
        const res = await apiUpdateCategory(editId, form);
        setCategories(categories.map(c => c.id === editId ? res : c));
        toast.success("Category updated");
      } else {
        const payload = { ...form, id: `CAT-${Date.now()}`, event_id: activeEventId };
        const res = await apiCreateCategory(payload as any);
        setCategories([...categories, res]);
        toast.success("Category created");
      }
      setShowForm(false);
    } catch(e: any) { toast.error(e.message); }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      setDeleteId(null);
      toast.success("Category deleted");
    } catch(e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Toolbar search={search} onSearch={setSearch} onAdd={openAdd} theme={theme} placeholder="Search categories..." addLabel="Add Category" />
      <TableWrap>
        <thead>
          <tr>
            <ThCol label="CODE" field="code" col={col} dir={dir} onToggle={() => toggle("code")} />
            <ThCol label="NAME" field="name" col={col} dir={dir} onToggle={() => toggle("name")} />
            <ThCol label="DESCRIPTION" field="description" col={col} dir={dir} onToggle={() => toggle("description")} />
            <ThCol label="STATUS" field="active" col={col} dir={dir} onToggle={() => toggle("active")} />
            <th style={{ padding: "10px 14px", width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && <EmptyRow cols={5} />}
          {sorted.map(c => (
            <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-row-hover">
              <Td><CodeBadge>{c.code}</CodeBadge></Td>
              <Td><span style={{ fontWeight: 600, color: theme.textColor }}>{c.name}</span></Td>
              <Td><span style={{ color: theme.textMutedColor }}>{c.description || "-"}</span></Td>
              <Td><Pill active={!!c.active} /></Td>
              <Td><RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} theme={theme} /></Td>
            </motion.tr>
          ))}
        </tbody>
      </TableWrap>
      <AnimatePresence>
        {showForm && (
          <SlidePanel title={editId ? "Edit Category" : "Add Category"} onClose={() => setShowForm(false)} theme={theme}>
            <Field label="Category Code" value={form.code ?? ""} onChange={v => setForm(f => ({ ...f, code: v }))} disabled={!!editId} />
            <Field label="Category Name" value={form.name ?? ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. VIP" />
            <Field label="Description" value={form.description ?? ""} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional short description" />
            <ActiveToggle value={!!form.active} onChange={v => setForm(f => ({ ...f, active: v }))} theme={theme} />
            <PanelActions onSave={save} onCancel={() => setShowForm(false)} theme={theme} />
          </SlidePanel>
        )}
        {deleteId && (
          <DeleteModal name={categories.find(c => c.id === deleteId)?.name ?? ""} onConfirm={() => del(deleteId)} onCancel={() => setDeleteId(null)} theme={theme} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FUNCTIONS TAB ────────────────────────────────────────────────────────────
function FunctionsTab({ theme }: { theme: any }) {
  const { functions, setFunctions, activeEventId, events } = useApp();
  const currentEvent = events.find(e => e.id === activeEventId);
  const prefix = currentEvent ? currentEvent.eventCode + "-" : "";
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<MasterFunction>>({});

  const filtered = functions.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.code || "").toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  const openAdd = () => {
    const nextNum = functions.length + 1;
    const autoCode = `${prefix}FUNC-${String(nextNum).padStart(3, "0")}`;
    setForm({ active: true, code: autoCode }); 
    setEditId(null); 
    setShowForm(true); 
  };
  const openEdit = (c: MasterFunction) => { setForm(c); setEditId(c.id); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.code) return toast.error("Please fill name and code");
    try {
      if (editId) {
        const res = await apiUpdateFunction(editId, form);
        setFunctions(functions.map(c => c.id === editId ? res : c));
        toast.success("Function updated");
      } else {
        const payload = { ...form, id: `FUNC-${Date.now()}`, event_id: activeEventId };
        const res = await apiCreateFunction(payload as any);
        setFunctions([...functions, res]);
        toast.success("Function created");
      }
      setShowForm(false);
    } catch(e: any) { toast.error(e.message); }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteFunction(id);
      setFunctions(functions.filter(c => c.id !== id));
      setDeleteId(null);
      toast.success("Function deleted");
    } catch(e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Toolbar search={search} onSearch={setSearch} onAdd={openAdd} theme={theme} placeholder="Search functions..." addLabel="Add Function" />
      <TableWrap>
        <thead>
          <tr>
            <ThCol label="CODE" field="code" col={col} dir={dir} onToggle={() => toggle("code")} />
            <ThCol label="NAME" field="name" col={col} dir={dir} onToggle={() => toggle("name")} />
            <ThCol label="STATUS" field="active" col={col} dir={dir} onToggle={() => toggle("active")} />
            <th style={{ padding: "10px 14px", width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && <EmptyRow cols={4} />}
          {sorted.map(c => (
            <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-row-hover">
              <Td><CodeBadge>{c.code}</CodeBadge></Td>
              <Td><span style={{ fontWeight: 600, color: theme.textColor }}>{c.name}</span></Td>
              <Td><Pill active={!!c.active} /></Td>
              <Td><RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} theme={theme} /></Td>
            </motion.tr>
          ))}
        </tbody>
      </TableWrap>
      <AnimatePresence>
        {showForm && (
          <SlidePanel title={editId ? "Edit Function" : "Add Function"} onClose={() => setShowForm(false)} theme={theme}>
            <Field label="Function Code" value={form.code ?? ""} onChange={v => setForm(f => ({ ...f, code: v }))} disabled={!!editId} />
            <Field label="Function Name" value={form.name ?? ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Speaker" />
            <ActiveToggle value={!!form.active} onChange={v => setForm(f => ({ ...f, active: v }))} theme={theme} />
            <PanelActions onSave={save} onCancel={() => setShowForm(false)} theme={theme} />
          </SlidePanel>
        )}
        {deleteId && (
          <DeleteModal name={functions.find(c => c.id === deleteId)?.name ?? ""} onConfirm={() => del(deleteId)} onCancel={() => setDeleteId(null)} theme={theme} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PARTICIPANTS TAB ─────────────────────────────────────────────────────────
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../Pagination";

function ParticipantsTab({ theme }: { theme: any }) {
  const { categories, functions, activeEventId } = useApp();
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // Search State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Sorting State
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editP, setEditP] = useState<ParticipantData | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", email: "", jobTitle: "", company: "", 
    phone: "", idType: "", employeeId: "", nationality: "" 
  });
  const [viewCard, setViewCard] = useState<any>(null);
  const [eventLayout, setEventLayout] = useState<any>(null);
  const [isFetchingLayout, setIsFetchingLayout] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchParticipants = async () => {
      setLoading(true);
      setError("");
      try {
        const fetchEventId = activeEventId || undefined;
        const response = await apiGetParticipants(fetchEventId, page, perPage, debouncedSearch, sortField, sortDirection);
        if (isMounted) {
          setParticipants(response.data);
          setTotal(response.total);
          setLastPage(response.last_page);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load participants");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchParticipants();
    return () => { isMounted = false; };
  }, [activeEventId, page, perPage, debouncedSearch, sortField, sortDirection]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openViewCard = async (p: ParticipantData) => {
    if (!p.event_id) {
       toast.error("Participant not linked to any event."); return;
    }
    if (!p.card) {
       toast.error("No card generated yet."); return;
    }
    setIsFetchingLayout(true);
    try {
      const layout = await apiGetEventLayout(p.event_id);
      setEventLayout(layout);
      setViewCard(p.card);
    } catch(err: any) {
      toast.error(err.message || "Failed to fetch event layout");
    } finally {
      setIsFetchingLayout(false);
    }
  };

  const handleDownloadPdf = async (p: ParticipantData) => {
    if (!p.event_id) {
       toast.error("Participant not linked to any event."); return;
    }
    if (!p.card) {
       toast.error("No card generated yet."); return;
    }
    setIsFetchingLayout(true);
    try {
      const layout = await apiGetEventLayout(p.event_id);
      await downloadCardPDF(p.card, layout);
    } catch(err: any) {
      toast.error(err.message || "Failed to fetch event layout");
    } finally {
      setIsFetchingLayout(false);
    }
  };

  const openEdit = (p: ParticipantData) => {
    setEditP(p);
    setEditForm({ 
      name: p.name || "", 
      email: p.email || "", 
      jobTitle: p.job_title || "", 
      company: p.company || "",
      phone: p.phone || "",
      idType: p.id_type || "",
      employeeId: p.employee_id || "",
      nationality: p.nationality || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editP) return;
    try {
      const res = await apiUpdateParticipant(editP.id, editForm);
      setParticipants(participants.map(p => p.id === editP.id ? { ...p, ...editForm } : p));
      setEditP(null);
      toast.success("Participant updated");
    } catch(e: any) { toast.error(e.message); }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const del = async (id: string) => {
    try {
      await apiDeleteParticipant(id);
      setParticipants(participants.filter(p => p.id !== id));
      setDeleteId(null);
      setTotal(prev => prev - 1);
      toast.success("Participant deleted");
    } catch(e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Toolbar search={search} onSearch={setSearch} onAdd={() => toast.info("Add/Edit via form page.")} theme={theme} placeholder="Search participants..." addLabel="Participant Form" />
      <TableWrap>
        <thead>
          <tr>
            <ThCol label="NAME" field="name" col={sortField} dir={sortDirection} onToggle={() => handleSort("name")} />
            <ThCol label="EMAIL" field="email" col={sortField} dir={sortDirection} onToggle={() => handleSort("email")} />
            <ThCol label="JOB TITLE" field="job_title" col={sortField} dir={sortDirection} onToggle={() => handleSort("job_title")} />
            <ThCol label="COMPANY" field="company" col={sortField} dir={sortDirection} onToggle={() => handleSort("company")} />
            <th style={{ padding: "10px 14px", width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: theme.textMutedColor }}>Loading participants...</td></tr>
          ) : error ? (
            <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#e53e5e" }}>{error}</td></tr>
          ) : participants.length === 0 ? (
            <EmptyRow cols={5} />
          ) : participants.map(p => {
            const phoneStr = p.phone || "";
            const waNum = phoneStr.replace(/\D/g, "");
            const waUrl = waNum ? `https://wa.me/${waNum.startsWith("0") ? "62" + waNum.slice(1) : waNum}` : "";
            return (
            <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-row-hover">
              <Td><span style={{ fontWeight: 600, color: theme.textColor }}>{p.name}</span></Td>
              <Td><span style={{ color: theme.textMutedColor }}>{p.email}</span></Td>
              <Td><span style={{ color: theme.textMutedColor }}>{p.job_title || "-"}</span></Td>
              <Td><span style={{ color: theme.textMutedColor }}>{p.company || "-"}</span></Td>
              <Td>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp Chat"
                      style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.1)", color: "#22c55e", textDecoration: "none" }}>
                      <MessageCircle size={13} />
                    </a>
                  )}
                  <button onClick={() => openViewCard(p)} title="Preview card"
                    style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "none", cursor: "pointer" }}
                    disabled={isFetchingLayout}
                  >
                    <Eye size={13} />
                  </button>
                  <button onClick={() => handleDownloadPdf(p)} title="Download card as PDF"
                    style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", cursor: "pointer" }}
                    disabled={isFetchingLayout}
                  >
                    <Download size={13} />
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit participant"
                    style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} title="Delete participant" style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </Td>
            </motion.tr>
          )})}
        </tbody>
      </TableWrap>

      <Pagination 
        currentPage={page} 
        lastPage={lastPage} 
        total={total} 
        perPage={perPage} 
        onPageChange={setPage} 
        onPerPageChange={setPerPage} 
        theme={theme} 
      />

      <AnimatePresence>
        {deleteId && (
          <DeleteModal name={participants.find(p => p.id === deleteId)?.name ?? ""} onConfirm={() => del(deleteId)} onCancel={() => setDeleteId(null)} theme={theme} />
        )}
        {editP && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEditP(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ background: theme.cardColor, padding: 24, borderRadius: R * 2, width: 450, border: `1px solid ${theme.borderColor}`, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: theme.textColor }}>Edit Participant</h3>
                <button onClick={() => setEditP(null)} style={{ background: "none", border: "none", color: theme.textMutedColor, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                <input placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="Job Title" value={editForm.jobTitle} onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                  <input placeholder="Company" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                  <input placeholder="Nationality" value={editForm.nationality} onChange={e => setEditForm({ ...editForm, nationality: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="ID Type" value={editForm.idType} onChange={e => setEditForm({ ...editForm, idType: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                  <input placeholder="Employee ID" value={editForm.employeeId} onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })} style={{ padding: 10, borderRadius: R, border: `1px solid ${theme.borderColor}`, background: theme.bgColor, color: theme.textColor }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                <button onClick={() => setEditP(null)} style={{ flex: 1, padding: 10, borderRadius: R, background: theme.bgColor, border: `1px solid ${theme.borderColor}`, color: theme.textColor, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSaveEdit} style={{ flex: 1, padding: 10, borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {viewCard && eventLayout && (
          <CardPreviewDialog 
            viewCard={viewCard} 
            eventLayout={eventLayout} 
            theme={theme} 
            onClose={() => setViewCard(null)} 
            onDownload={() => {
              downloadCardPDF(viewCard, eventLayout);
              setViewCard(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type MasterTab = "categories" | "functions" | "countries" | "participants";

const TABS: { id: MasterTab; label: string; icon: React.ReactNode }[] = [
  { id: "categories", label: "Category", icon: <Tag size={15} /> },
  { id: "functions", label: "Function", icon: <Briefcase size={15} /> },
  { id: "countries", label: "Countries", icon: <Globe size={15} /> },
  { id: "participants", label: "Participants", icon: <Users size={15} /> },
];

export function MasterDataPage() {
  const { theme, categories, functions, countries, participants, activeEventId, events, currentUser, setActiveEventId, page, setPage } = useApp();
  const [activeTab, setActiveTab] = useState<MasterTab>("categories");

  const currentEvent = events.find(e => e.id === activeEventId);

  const isSuperadminMode = page === "superadmin-countries";

  const counts: Record<MasterTab, number> = {
    categories: categories.length,
    functions: functions.length,
    countries: countries.length,
    participants: participants?.length || 0,
  };

  const visibleTabs = isSuperadminMode ? TABS.filter(t => t.id === "countries") : TABS;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Event Banner */}
      {currentUser?.role === "superadmin" && currentEvent && !isSuperadminMode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: `${theme.primaryColor}15`, border: `1px solid ${theme.primaryColor}30`, borderRadius: R * 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Briefcase size={18} style={{ color: theme.primaryColor }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.textColor }}>Managing Master Data for: {currentEvent.name}</div>
              <div style={{ fontSize: 12, color: theme.textMutedColor }}>All new categories and functions will be scoped to this event.</div>
            </div>
          </div>
          <button onClick={() => { setActiveEventId(null); setPage("superadmin-events"); }}
            style={{ padding: "8px 14px", borderRadius: R, background: theme.cardColor, color: theme.textColor, border: `1px solid ${theme.borderColor}`, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Back to Events
          </button>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {visibleTabs.map(t => (
          <div key={t.id} style={{ padding: "14px 20px", borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", gap: 10, minWidth: 150, flex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: R, background: `${theme.primaryColor}18`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: theme.textColor, fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>{counts[t.id]}</div>
              <div style={{ fontSize: 12, color: theme.textMutedColor, marginTop: 2 }}>{t.label} records</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab container */}
      <div style={{ borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, overflow: "hidden" }}>
        {/* Tab bar */}
        {!isSuperadminMode && (
          <div style={{ display: "flex", borderBottom: `1px solid ${theme.borderColor}` }}>
            {visibleTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "13px 22px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  color: activeTab === t.id ? theme.primaryColor : theme.textMutedColor,
                  borderBottom: activeTab === t.id ? `2px solid ${theme.primaryColor}` : "2px solid transparent",
                  transition: "all 0.15s",
                }}>
                {t.icon}
                {t.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                  background: activeTab === t.id ? `${theme.primaryColor}25` : theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                  color: activeTab === t.id ? theme.primaryColor : theme.textMutedColor,
                }}>
                  {counts[t.id]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tab body */}
        <div style={{ padding: "20px 22px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={isSuperadminMode ? "countries" : activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {(!isSuperadminMode && activeTab === "categories") && <CategoriesTab theme={theme} />}
              {(!isSuperadminMode && activeTab === "functions") && <FunctionsTab theme={theme} />}
              {(!isSuperadminMode && activeTab === "participants") && <ParticipantsTab theme={theme} />}
              {(isSuperadminMode || activeTab === "countries") && <CountriesTab theme={theme} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Row hover style */}
      <style>{`.table-row-hover:hover { background: ${theme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"}; }`}</style>
    </div>
  );
}
