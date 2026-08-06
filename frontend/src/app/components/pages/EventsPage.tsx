import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../AppContext";
import type { EventData, CardData } from "../../api";
import { apiGetCards, apiUpdateCard, apiDeleteCard, apiUpdateParticipant, apiDeleteParticipant, apiGetEventLayout } from "../../api";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  Search, Plus, Edit2, Trash2, Check, X, Calendar, MapPin, CreditCard,
  ChevronUp, ChevronDown, AlertCircle, ToggleLeft, ToggleRight, CalendarDays,
  Users, Layout, ArrowLeft, CheckCircle2, Circle, Pencil, Eye, Download, FileText,
  MessageCircle, FileSpreadsheet
} from "lucide-react";

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

// ── Participant (card) status icon ──────────────────────────────────────────
function ParticipantStatusIcon({ status }: { status: "draft" | "completed" | "updated" | "error" }) {
  let color = "#94a3b8"; // gray for draft/default
  if (status === "completed") color = "#10b981"; // green
  else if (status === "updated") color = "#f59e0b"; // yellow
  else if (status === "error") color = "#e53e5e"; // red

  return <CreditCard size={16} style={{ color, flexShrink: 0 }} />;
}

import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../Pagination";

// ── Participants Panel ───────────────────────────────────────────────────────
function ParticipantsPanel({ event, onClose, hideClose }: { event: EventData; onClose: () => void; hideClose?: boolean }) {
  const { theme, setActiveCardId, setActiveEventId, setCardElements, setCardOrientation, setPage, categories, functions: fns, countries } = useApp();
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pagination State
  const [page, setPageNum] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // Search State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Sorting State
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [editParticipant, setEditParticipant] = useState<CardData | null>(null);
  const [viewCard, setViewCard] = useState<CardData | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [eventLayout, setEventLayout] = useState<{ elements: any[]; card_orientation: string; background_color: string; has_layout: boolean; layout_json?: any } | null>(null);
  const offscreenRef = useRef<HTMLDivElement>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
    email: "",
    phone: "",
    idType: "Employee ID",
    employeeId: "",
    category: "",
    function: "",
    nationality: "US",
  });

  // Load participants + event layout
  useEffect(() => {
    let isMounted = true;
    const fetchCards = async () => {
      setLoading(true);
      setError("");
      try {
        const [response, layout] = await Promise.all([
          apiGetCards(event.id, page, perPage, debouncedSearch, sortField, sortDirection),
          apiGetEventLayout(event.id).catch(() => null)
        ]);
        if (isMounted) {
          setCards(response.data);
          setTotal(response.total);
          setLastPage(response.last_page);
          if (layout) setEventLayout(layout);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load participants");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCards();
    return () => { isMounted = false; };
  }, [event.id, page, perPage, debouncedSearch, sortField, sortDirection]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPageNum(1);
  }, [debouncedSearch]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openEditor = (card: CardData) => {
    setActiveCardId(card.id);
    setActiveEventId(event.id);
    setCardElements((card.layout_json ?? eventLayout?.elements ?? []) as any[]);
    setCardOrientation((eventLayout?.card_orientation ?? card.card_orientation ?? "landscape") as any);
    setPage("card-editor");
    onClose();
  };

  const deleteParticipant = async (id: string) => {
    try {
      const card = cards.find(c => c.id === id);
      if (card && card.participant_id) {
        await apiDeleteParticipant(card.participant_id);
      } else {
        await apiDeleteCard(id);
      }
      setCards(cards.filter(c => c.id !== id));
      setDeleteCardId(null);
      setTotal(prev => prev - 1);
      toast.success("Participant deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete participant.");
    }
  };

  const openEditParticipant = (card: CardData) => {
    const pd = card.participant_data || {};
    setEditParticipant(card);
    setEditForm({
      title: pd.title || "",
      firstName: pd.firstName || "",
      lastName: pd.lastName || "",
      gender: pd.gender || "",
      dateOfBirth: pd.dateOfBirth || "",
      jobTitle: pd.jobTitle || "",
      organization: pd.organization || "",
      email: pd.email || "",
      mobileNumber: pd.mobileNumber || "",
      officeNumber: pd.officeNumber || "",
      documentType: pd.documentType || "Employee ID",
      idNumber: pd.idNumber || "",
      category: pd.category || "",
      function: pd.function || "",
      nationality: pd.nationality || "US",
      issueDate: pd.issueDate || "",
      expirationDate: pd.expirationDate || "",
    });
  };

  const handleSaveParticipant = async () => {
    if (!editParticipant) return;
    try {
      const fullName = `${editForm.firstName} ${editForm.lastName}`.trim();
      const pId = editParticipant.participant_id || editParticipant.id;
      await apiUpdateParticipant(pId, {
        name: fullName,
        jobTitle: editForm.jobTitle,
        company: editForm.organization,
        email: editForm.email,
        phone: editForm.mobileNumber,
        idType: editForm.documentType,
        employeeId: editForm.idNumber,
        category: editForm.category,
        function: editForm.function,
        nationality: editForm.nationality,
      });

      // Update local state instantly
      setCards(prev => prev.map(c => {
        if (c.id === editParticipant.id) {
          let newStatus = c.status;
          if (c.status === "completed") {
            newStatus = "updated";
          }
          return {
            ...c,
            name: fullName,
            status: newStatus,
            layout_done: newStatus === "completed" || newStatus === "updated",
            participant_data: {
              ...c.participant_data,
              ...editForm,
              firstName: editForm.firstName,
              lastName: editForm.lastName,
            }
          };
        }
        return c;
      }));

      toast.success("Participant details updated successfully!");
      setEditParticipant(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update participant.");
    }
  };

  // ── Individual PDF download ────────────────────────────────────────────────
  const downloadCardPDF = async (card: any) => {
    if (!eventLayout || !eventLayout.has_layout) {
      toast.error("No layout template saved for this event yet.");
      return;
    }
    const layoutElements = (eventLayout.elements as any[]) || [];
    let width = 360, height = 210, isPortrait = false;
    if (eventLayout.card_orientation?.startsWith("custom_")) {
      const parts = eventLayout.card_orientation.split("_");
      width = Number(parts[1]) || 260;
      height = Number(parts[2]) || 360;
      isPortrait = height > width;
    } else {
      const CARD_SIZES: Record<string, { width: number; height: number }> = { landscape: { width: 360, height: 210 }, portrait: { width: 210, height: 360 }, square: { width: 260, height: 260 } };
      const orientation = (eventLayout.card_orientation ?? "landscape") as keyof typeof CARD_SIZES;
      width = CARD_SIZES[orientation].width;
      height = CARD_SIZES[orientation].height;
      isPortrait = orientation === "portrait" || orientation === "square";
    }

    const bgElem = layoutElements.find((e: any) => e.id === "system-bg-image");
    const bgImage = bgElem ? bgElem.imageUrl : null;
    const elements = layoutElements.filter((e: any) => e.id !== "system-bg-image");

    const pd = typeof card.participant_data === "string" ? JSON.parse(card.participant_data || "{}") : (card.participant_data || {});
    const renderedElements = elements.map((el: any) => {
      if (el.type === "text" && el.dataField) {
        let displayContent = "";
        if (el.dataField === "fullName") displayContent = `${pd?.firstName || ''} ${pd?.lastName || ''}`.trim();
        else if (el.dataField === "categoryName" && pd?.categoryName) displayContent = pd.categoryName;
        else if (el.dataField === "functionName" && pd?.functionName) displayContent = pd.functionName;
        else displayContent = pd?.[el.dataField] || el.content;
        return { ...el, content: displayContent };
      }
      if ((el.type === "photo" || el.type === "logo") && el.dataField) {
        return { ...el, imageUrl: pd?.[el.dataField] || el.imageUrl };
      }
      return el;
    });

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;z-index:-1;";
    const container = document.createElement("div");
    container.style.cssText = `width:${width}px;height:${height}px;background:${eventLayout.background_color || "#ffffff"};border-radius:12px;overflow:hidden;${bgImage ? `background-image:url('${bgImage}');background-size:cover;background-position:center;` : ""}`;
    wrapper.appendChild(container);

    
    renderedElements.sort((a: any, b: any) => a.layer - b.layer).forEach((el: any) => {
      const outerDiv = document.createElement("div");
      outerDiv.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}box-sizing:border-box;`;
      const innerDiv = document.createElement("div");
      innerDiv.style.cssText = `width:100%;height:100%;box-sizing:border-box;`;

      if (el.type === "photo" || el.type === "logo") {
        innerDiv.style.cssText += `overflow:hidden;border-radius:${el.borderRadius ?? 0}px;`;
      }
      if (el.type === "text") {
        innerDiv.style.cssText += `font-size:${el.fontSize ?? 12}px;font-weight:${el.fontWeight ?? 400};font-family:${el.fontFamily ?? "sans-serif"};color:${el.color ?? "#f0f0fa"};display:flex;align-items:center;justify-content:${el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start"};text-align:${el.textAlign ?? "left"};line-height:1.2;`;
        innerDiv.textContent = el.content;
      } else if (el.type === "badge") {
        innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 4}px;display:flex;align-items:center;justify-content:center;`;
        const span = document.createElement("span");
        span.style.cssText = `font-size:${el.fontSize ?? 9}px;font-weight:700;color:${el.color ?? "#fff"};line-height:1;display:inline-block;`;
        span.textContent = el.content;
        innerDiv.appendChild(span);
      } else if (el.type === "shape") {
        innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 0}px;${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}`;
      } else if (el.type === "divider") {
        innerDiv.style.cssText += `background:${el.bgColor ?? "rgba(255,255,255,0.1)"};`;
      } else if ((el.type === "photo" || el.type === "logo") && el.imageUrl) {
        const img = document.createElement("img");
        img.src = el.imageUrl;
        img.style.cssText = `width:100%;height:100%;object-fit:${el.type === "logo" ? "contain" : "cover"};${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}display:block;border-radius:${el.borderRadius ?? 0}px;`;
        img.crossOrigin = "anonymous";
        innerDiv.appendChild(img);
      }
      outerDiv.appendChild(innerDiv);
      container.appendChild(outerDiv);
    });
    document.body.appendChild(wrapper);
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 200));
    
    try {
      const dataUrl = await toPng(container, { pixelRatio: 2, cacheBust: true, backgroundColor: eventLayout.background_color || "#ffffff" });
      const pdf = new jsPDF({ orientation: isPortrait ? "portrait" : "landscape", unit: "px", format: [width, height] });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`${card.name.replace(/[^a-zA-Z0-9]/g, "_")}_card.pdf`);
      toast.success(`Downloaded PDF for ${card.name}`);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  // ── Bulk PDF download ──────────────────────────────────────────────────────
  const downloadAllCardsPDF = async () => {
    if (!eventLayout || !eventLayout.has_layout) {
      toast.error("No layout template saved for this event yet. Please save a layout in the Card Editor first.");
      return;
    }
    if (participants.length === 0) {
      toast.error("No participants to download.");
      return;
    }
    setDownloadingAll(true);
    let width = 360, height = 210, isPortrait = false;
    if (eventLayout.card_orientation?.startsWith("custom_")) {
      const parts = eventLayout.card_orientation.split("_");
      width = Number(parts[1]) || 260;
      height = Number(parts[2]) || 360;
      isPortrait = height > width;
    } else {
      const CARD_SIZES: Record<string, { width: number; height: number }> = {
        landscape: { width: 360, height: 210 },
        portrait: { width: 210, height: 360 },
        square: { width: 260, height: 260 },
      };
      const orientation = (eventLayout.card_orientation ?? "landscape") as keyof typeof CARD_SIZES;
      width = CARD_SIZES[orientation]?.width || 360;
      height = CARD_SIZES[orientation]?.height || 210;
      isPortrait = orientation === "portrait";
    }

    const pdf = new jsPDF({
      orientation: isPortrait ? "portrait" : "landscape",
      unit: "px",
      format: [width, height],
    });

    for (let i = 0; i < participants.length; i++) {
      const card = participants[i];
      setDownloadProgress(`Generating ${i + 1} of ${participants.length}: ${card.name}…`);
      const pd = card.participant_data as Record<string, string> | null;

      const layoutElements = (eventLayout.elements as any[]) || [];
      const bgElem = layoutElements.find((e: any) => e.id === "system-bg-image");
      const bgImage = bgElem ? bgElem.imageUrl : null;
      const elements = layoutElements.filter((e: any) => e.id !== "system-bg-image" && !e.hidden).map((el: any) => {
          if (el.type === "text" && el.dataField) {
            let displayContent = el.content;
            if (el.dataField === "fullName") displayContent = `${pd?.firstName || ''} ${pd?.lastName || ''}`.trim() || el.content;
            else if (el.dataField === "categoryName" && pd?.categoryName) displayContent = pd.categoryName;
            else if (el.dataField === "functionName" && pd?.functionName) displayContent = pd.functionName;
            else displayContent = pd?.[el.dataField] || el.content;
            return { ...el, content: displayContent };
          }
          if ((el.type === "photo" || el.type === "logo") && el.dataField) {
            const displayImage = pd?.[el.dataField] || el.imageUrl;
            return { ...el, imageUrl: displayImage };
          }
          return el;
        });


      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;z-index:-1;";
      const container = document.createElement("div");
      container.style.cssText = `width:${width}px;height:${height}px;background:${eventLayout.background_color || "#ffffff"};border-radius:12px;overflow:hidden;${bgImage ? `background-image:url('${bgImage}');background-size:cover;background-position:center;` : ""}`;
      wrapper.appendChild(container);
      elements.sort((a: any, b: any) => a.layer - b.layer).forEach((el: any) => {
        const outerDiv = document.createElement("div");
        outerDiv.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}box-sizing:border-box;`;
        const innerDiv = document.createElement("div");
        innerDiv.style.cssText = `width:100%;height:100%;box-sizing:border-box;`;

        if (el.type === "photo" || el.type === "logo") {
          innerDiv.style.cssText += `overflow:hidden;border-radius:${el.borderRadius ?? 0}px;`;
        }
        if (el.type === "text") {
          innerDiv.style.cssText += `font-size:${el.fontSize ?? 12}px;font-weight:${el.fontWeight ?? 400};font-family:${el.fontFamily ?? "sans-serif"};color:${el.color ?? "#f0f0fa"};display:flex;align-items:center;justify-content:${el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start"};text-align:${el.textAlign ?? "left"};line-height:1.2;`;
          innerDiv.textContent = el.content;
        } else if (el.type === "badge") {
          innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 4}px;display:flex;align-items:center;justify-content:center;`;
          const span = document.createElement("span");
          span.style.cssText = `font-size:${el.fontSize ?? 9}px;font-weight:700;color:${el.color ?? "#fff"};line-height:1;display:inline-block;`;
          span.textContent = el.content;
          innerDiv.appendChild(span);
        } else if (el.type === "shape") {
          innerDiv.style.cssText += `background:${el.bgColor ?? "#7c5cfc"};border-radius:${el.borderRadius ?? 0}px;${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}`;
        } else if (el.type === "divider") {
          innerDiv.style.cssText += `background:${el.bgColor ?? "rgba(255,255,255,0.1)"};`;
        } else if ((el.type === "photo" || el.type === "logo") && el.imageUrl) {
          const img = document.createElement("img");
          img.src = el.imageUrl;
          img.style.cssText = `width:100%;height:100%;object-fit:${el.type === "logo" ? "contain" : "cover"};${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"};` : "border:none;"}display:block;border-radius:${el.borderRadius ?? 0}px;`;
          img.crossOrigin = "anonymous";
          innerDiv.appendChild(img);
        }
        outerDiv.appendChild(innerDiv);
        container.appendChild(outerDiv);
      });
      document.body.appendChild(wrapper);
      await new Promise(r => setTimeout(r, 200));
      try {
        const dataUrl = await toPng(container, { pixelRatio: 2, cacheBust: true, backgroundColor: eventLayout.background_color || "#ffffff" });
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      } catch { /* skip failed card */ }
      document.body.removeChild(wrapper);
    }

    pdf.save(`${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_all_cards.pdf`);
    toast.success(`Downloaded ${participants.length} cards as PDF!`);
    setDownloadingAll(false);
    setDownloadProgress("");
  };

  const exportToExcel = () => {
    if (participants.length === 0) {
      toast.error("No participants to export.");
      return;
    }
    const headers = ["Name", "Job Title", "Company", "Email", "Phone", "ID Type", "Employee ID"];
    
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>';
    html += "<body><table border='1'>";
    
    html += "<tr>";
    headers.forEach(h => {
      html += `<th style="background:#4ade80; color:#fff;">${h}</th>`;
    });
    html += "</tr>";
    
    participants.forEach(card => {
      const pd = card.participant_data as Record<string, string> | null;
      html += "<tr>";
      html += `<td>${card.name}</td>`;
      html += `<td>${pd?.jobTitle || ""}</td>`;
      html += `<td>${pd?.company || pd?.organization || ""}</td>`;
      html += `<td>${pd?.email || ""}</td>`;
      html += `<td style="mso-number-format:'\\@'">${pd?.phone || pd?.mobileNumber || ""}</td>`;
      html += `<td>${pd?.documentType || pd?.idType || ""}</td>`;
      html += `<td style="mso-number-format:'\\@'">${pd?.idNumber || pd?.employeeId || ""}</td>`;
      html += "</tr>";
    });
    
    html += "</table></body></html>";

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_participants.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Exported to Excel!");
  };

  return (
    <motion.div
      initial={hideClose ? false : { opacity: 0 }} animate={hideClose ? false : { opacity: 1 }} exit={hideClose ? false : { opacity: 0 }}
      className={hideClose ? "flex-1 flex justify-center" : "fixed inset-0 z-40 flex justify-end"}
      style={hideClose ? { padding: "24px 28px", width: "100%", height: "100%" } : { background: "rgba(0,0,0,0.55)" }}
      onClick={hideClose ? undefined : onClose}
    >
      <motion.div
        initial={hideClose ? false : { x: "100%" }} animate={hideClose ? false : { x: 0 }} exit={hideClose ? false : { x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={hideClose 
          ? { flex: 1, maxWidth: 1200, background: theme.cardColor, borderRadius: 12, border: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column", overflow: "hidden" }
          : { width: 440, height: "100%", background: theme.sidebarColor, borderLeft: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.borderColor}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: theme.textColor }}>
                Participants
              </div>
              <div style={{ fontSize: 12, color: theme.textMutedColor, marginTop: 2 }}>{event.name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Export to Excel */}
              <button
                onClick={exportToExcel}
                title="Export all data to Excel"
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: "rgba(34,197,94,0.12)",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <FileSpreadsheet size={12} />
                Export Excel
              </button>

              {/* Download All PDF */}
              <button
                onClick={downloadAllCardsPDF}
                disabled={downloadingAll || !eventLayout?.has_layout}
                title={eventLayout?.has_layout ? "Download all cards as PDF" : "Save a layout template first"}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: downloadingAll || !eventLayout?.has_layout ? "not-allowed" : "pointer",
                  background: eventLayout?.has_layout ? "rgba(14,165,233,0.12)" : theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: eventLayout?.has_layout ? "#0ea5e9" : theme.textMutedColor,
                  border: `1px solid ${eventLayout?.has_layout ? "rgba(14,165,233,0.3)" : theme.borderColor}`,
                  opacity: downloadingAll ? 0.7 : 1,
                }}
              >
                <FileText size={12} />
                {downloadingAll ? downloadProgress || "Generating…" : "Download All PDF"}
              </button>
              {!hideClose && (
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, display: "flex" }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${theme.borderColor}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "0 12px" }}>
            <Search size={13} style={{ color: theme.textMutedColor }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search participants…"
              style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, flex: 1, padding: "8px 0" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={11} /></button>}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: theme.textMutedColor, fontSize: 13 }}>Loading…</div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: 40, color: "#e53e5e", fontSize: 13 }}>{error}</div>
          )}
          {!loading && !error && cards.length === 0 && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Users size={32} style={{ color: theme.textMutedColor, opacity: 0.3, margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: theme.textMutedColor }}>No participants yet.</p>
              <p style={{ fontSize: 12, color: theme.textMutedColor, opacity: 0.7 }}>Use the Form page to add participants.</p>
            </div>
          )}
          {!loading && !error && cards.length > 0 && (
            <div style={{ background: theme.cardColor, borderRadius: R, border: `1px solid ${theme.borderColor}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: theme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${theme.borderColor}` }}>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, cursor: "pointer" }} onClick={() => handleSort("name")}>
                      Name {sortField === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, cursor: "pointer" }}>Job Title</th>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, cursor: "pointer" }}>Company</th>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, cursor: "pointer" }}>Email</th>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, cursor: "pointer" }}>Phone</th>
                    <th style={{ padding: "12px", fontWeight: 600, color: theme.textMutedColor, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card, i) => {
                    const pd = card.participant_data as Record<string, string> | null;

                    return (
                      <motion.tr key={card.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 20) * 0.04 }} style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 600, color: theme.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                            {card.name}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ color: theme.textMutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                            {pd?.jobTitle || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ color: theme.textMutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                            {pd?.company || pd?.organization || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ color: theme.textMutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                            {pd?.email || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ color: theme.textMutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                            {pd?.phone || pd?.mobileNumber || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {(() => {
                              const phoneStr = pd?.phone || pd?.mobileNumber || pd?.whatsapp || "";
                              const waNum = phoneStr.replace(/\D/g, "");
                              const waUrl = waNum ? `https://wa.me/${waNum.startsWith("0") ? "62" + waNum.slice(1) : waNum}` : "";
                              if (!waUrl) return null;
                              return (
                                <a href={waUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp Chat"
                                  style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.1)", color: "#22c55e", textDecoration: "none" }}>
                                  <MessageCircle size={13} />
                                </a>
                              );
                            })()}

                            <button onClick={() => setViewCard(card)} title="Preview card"
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "none", cursor: "pointer" }}>
                              <Eye size={13} />
                            </button>

                            <button onClick={() => downloadCardPDF(card)} title="Download card as PNG"
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", cursor: "pointer" }}>
                              <Download size={13} />
                            </button>

                            <button onClick={() => openEditParticipant(card)} title="Edit participant details"
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer" }}>
                              <Pencil size={13} />
                            </button>

                            <button onClick={() => setDeleteCardId(card.id)} title="Delete participant"
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination 
          currentPage={page} 
          lastPage={lastPage} 
          total={total} 
          perPage={perPage} 
          onPageChange={setPageNum} 
          onPerPageChange={setPerPage} 
          theme={theme} 
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteCardId && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setDeleteCardId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, padding: 24, width: 300, margin: "0 16px" }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: theme.textColor, marginBottom: 8 }}>Delete Participant?</p>
                <p style={{ fontSize: 12, color: theme.textMutedColor, marginBottom: 20 }}>
                  Remove <strong style={{ color: theme.textColor }}>{cards.find(c => c.id === deleteCardId)?.name}</strong>? This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setDeleteCardId(null)} style={{ flex: 1, padding: "8px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 12 }}>Cancel</button>
                  <button onClick={() => deleteParticipant(deleteCardId!)} style={{ flex: 1, padding: "8px", borderRadius: R, background: "#e53e5e", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Participant details modal */}
        <AnimatePresence>
          {editParticipant && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setEditParticipant(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: theme.cardColor,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: R * 2,
                  padding: 20,
                  width: 380,
                  maxHeight: "85%",
                  overflowY: "auto",
                  margin: "0 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>Edit Details</h4>
                    <button onClick={() => setEditParticipant(null)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, display: "flex" }}><X size={16} /></button>
                  </div>
                  <p style={{ fontSize: 11, color: theme.textMutedColor, margin: 0 }}>Update participant profile information</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>FIRST NAME</label>
                      <input
                        value={editForm.firstName}
                        onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>LAST NAME</label>
                      <input
                        value={editForm.lastName}
                        onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>JOB TITLE</label>
                      <input
                        value={editForm.jobTitle}
                        onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>ORGANIZATION</label>
                      <input
                        value={editForm.organization}
                        onChange={e => setEditForm({ ...editForm, organization: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>EMAIL</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>MOBILE NUMBER</label>
                      <input
                        value={editForm.mobileNumber}
                        onChange={e => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>DOCUMENT TYPE</label>
                      <input
                        value={editForm.documentType}
                        onChange={e => setEditForm({ ...editForm, documentType: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>ID NUMBER</label>
                      <input
                        value={editForm.idNumber}
                        onChange={e => setEditForm({ ...editForm, idNumber: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>CATEGORY</label>
                      <select
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none", cursor: "pointer" }}
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.active).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>FUNCTION</label>
                      <select
                        value={editForm.function}
                        onChange={e => setEditForm({ ...editForm, function: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none", cursor: "pointer" }}
                      >
                        <option value="">Select Function</option>
                        {fns.filter(f => f.active).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor }}>NATIONALITY</label>
                    <select
                      value={editForm.nationality}
                      onChange={e => setEditForm({ ...editForm, nationality: e.target.value })}
                      style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "7px 10px", color: theme.textColor, fontSize: 12, outline: "none", cursor: "pointer" }}
                    >
                      {countries.filter(c => c.active).map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => setEditParticipant(null)}
                    style={{ flex: 1, padding: "8px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveParticipant}
                    style={{ flex: 1, padding: "8px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* View Card Modal */}
        <AnimatePresence>
          {viewCard && (() => {
            let CARD_W = 360, CARD_H = 210;
            if (eventLayout?.card_orientation?.startsWith("custom_")) {
              const parts = eventLayout.card_orientation.split("_");
              CARD_W = Number(parts[1]) || 260;
              CARD_H = Number(parts[2]) || 360;
            } else {
              const CARD_SIZES: Record<string, { width: number; height: number }> = {
                landscape: { width: 360, height: 210 },
                portrait: { width: 210, height: 360 },
                square: { width: 260, height: 260 },
              };
              const orientation = (eventLayout?.card_orientation ?? "landscape") as keyof typeof CARD_SIZES;
              CARD_W = CARD_SIZES[orientation]?.width || 360;
              CARD_H = CARD_SIZES[orientation]?.height || 210;
            }

            return (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setViewCard(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: R * 2, padding: 24, width: 420, maxHeight: "90%", overflowY: "auto" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: theme.textColor, margin: 0 }}>Card Preview</h4>
                      <p style={{ fontSize: 11, color: theme.textMutedColor, margin: "2px 0 0" }}>{viewCard.name}</p>
                    </div>
                    <button onClick={() => setViewCard(null)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={18} /></button>
                  </div>

                  {/* Mini card preview */}
                  <div style={{
                    width: "100%", aspectRatio: `${CARD_W}/${CARD_H}`, background: eventLayout?.background_color ?? "#ffffff",
                  borderRadius: 10, position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  marginBottom: 16,
                  backgroundImage: (() => {
                    const bgElem = (eventLayout?.elements as any[] || []).find((e: any) => e.id === "system-bg-image");
                    return bgElem ? `url('${bgElem.imageUrl}')` : undefined;
                  })(),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  containerType: "inline-size"
                }}>
                  {eventLayout?.has_layout ? (
                    [...(eventLayout.elements ?? [])].filter(e => e.id !== "system-bg-image" && !e.hidden).sort((a, b) => a.layer - b.layer).map((el: any, idx: number) => {
                      const pd = viewCard.participant_data as Record<string, string> | null;
                      const scaleX = 100 / CARD_W;
                      
                      let displayContent = el.content;
                      let displayImage = el.imageUrl;

                      if (el.type === "text" && el.dataField) {
                        if (el.dataField === "fullName") displayContent = `${pd?.firstName || ''} ${pd?.lastName || ''}`.trim() || el.content;
                        else if (el.dataField === "categoryName" && pd?.categoryName) displayContent = pd.categoryName;
                        else if (el.dataField === "functionName" && pd?.functionName) displayContent = pd.functionName;
                        else displayContent = pd?.[el.dataField] || el.content;
                      }

                      if ((el.type === "photo" || el.type === "logo") && el.dataField) {
                        displayImage = pd?.[el.dataField] || el.imageUrl;
                      }

                      return (
                        <div key={idx} style={{
                          position: "absolute",
                          left: `${(el.x / CARD_W) * 100}%`,
                          top: `${(el.y / CARD_H) * 100}%`,
                          width: `${(el.width / CARD_W) * 100}%`,
                          height: `${(el.height / CARD_H) * 100}%`,
                          boxSizing: "border-box",
                        }}>
                          {el.type === "text" && (
                            <div style={{ fontSize: `${(el.fontSize ?? 12) / CARD_W * 100}cqi`, fontWeight: el.fontWeight ?? 400, fontFamily: el.fontFamily ?? "sans-serif", color: el.color ?? "#f0f0fa", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start", overflow: "hidden", lineHeight: 1.3, textAlign: el.textAlign ?? "left" }}>
                              {displayContent}
                            </div>
                          )}
                          {el.type === "badge" && (
                            <div style={{ background: el.bgColor ?? "#7c5cfc", borderRadius: `${(el.borderRadius ?? 4) / CARD_W * 100}cqi`, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", boxSizing: "border-box" }}>
                              <span style={{ fontSize: `${(el.fontSize ?? 9) / CARD_W * 100}cqi`, fontWeight: 700, color: el.color ?? "#fff" }}>{displayContent}</span>
                            </div>
                          )}
                          {el.type === "divider" && (
                            <div style={{ background: el.bgColor ?? "rgba(255,255,255,0.1)", width: "100%", height: "100%" }} />
                          )}
                          {el.type === "shape" && (
                            <div style={{ width: "100%", height: "100%", background: el.bgColor ?? "#7c5cfc", borderRadius: `${(el.borderRadius ?? 0) / CARD_W * 100}cqi`, border: el.borderWidth ? `${el.borderWidth / CARD_W * 100}cqi solid ${el.borderColor ?? "#e53e5e"}` : "none", boxSizing: "border-box" }} />
                          )}
                          {(el.type === "photo" || el.type === "logo") && (
                            displayImage 
                              ? <img src={displayImage} alt="" style={{ width: "100%", height: "100%", objectFit: el.type === "logo" ? "contain" : "cover", borderRadius: `${(el.borderRadius ?? 0) / CARD_W * 100}cqi`, border: el.borderWidth ? `${el.borderWidth / CARD_W * 100}cqi solid ${el.borderColor ?? "#e53e5e"}` : "none", boxSizing: "border-box", display: "block" }} />
                              : <div style={{ width: "100%", height: "100%", background: el.type === "photo" ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.06)", borderRadius: `${(el.borderRadius ?? (el.type==="photo"?0:6)) / CARD_W * 100}cqi`, border: el.borderWidth ? `${el.borderWidth / CARD_W * 100}cqi solid ${el.borderColor ?? "#e53e5e"}` : `1px dashed rgba(255,255,255,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }} />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#7070a0", fontSize: 12 }}>
                      No template layout saved yet
                    </div>
                  )}
                </div>

                {/* Participant Data */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(viewCard.participant_data ?? {}).filter(([k]) => !["firstName", "lastName"].includes(k)).map(([key, val]) => {
                    if (!val) return null;
                    const strVal = String(val);
                    const isImage = strVal.startsWith("data:image/") || strVal.startsWith("http");
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: isImage ? "flex-start" : "center", padding: "5px 0", borderBottom: `1px solid ${theme.borderColor}`, fontSize: 12, gap: 16 }}>
                        <span style={{ color: theme.textMutedColor, textTransform: "capitalize", minWidth: 100 }}>{key.replace(/([A-Z])/g, " $1")}</span>
                        {isImage ? (
                          <img src={strVal} alt={key} style={{ maxWidth: "100%", maxHeight: 100, borderRadius: 6, objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: theme.textColor, fontWeight: 500, wordBreak: "break-all", textAlign: "right" }}>{strVal}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => { downloadCardPDF(viewCard); setViewCard(null); }}
                    style={{ flex: 1, padding: "8px", borderRadius: R, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </motion.div>
            </motion.div>
            );
          })()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Main EventsPage ───────────────────────────────────────────────────────────
export function EventsPage() {
  const { theme, events, setEvents, currentUser, users, cards } = useApp();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<EventData>>({});
  const [participantsEvent, setParticipantsEvent] = useState<EventData | null>(null);

  const isSuperadmin = currentUser?.role === "superadmin";

  const visibleEvents = isSuperadmin ? events : events.filter(e => {
    const ids = Array.isArray(currentUser?.eventId) ? currentUser!.eventId : (currentUser?.eventId ? [currentUser!.eventId] : []);
    return ids.includes(e.id);
  });

  const filtered = visibleEvents.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  const openAdd = () => { setForm({ active: true, date: new Date().toISOString().split("T")[0] }); setEditId(null); setShowForm(true); };
  const openEdit = (ev: EventData) => { setForm(ev); setEditId(ev.id); setShowForm(true); };

  if (!isSuperadmin) {
    const adminEventId = Array.isArray(currentUser?.eventId) ? currentUser?.eventId[0] : currentUser?.eventId;
    const adminEvent = events.find(e => e.id === adminEventId);

    if (!adminEvent) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: theme.textMutedColor }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: theme.textColor }}>No Event Assigned</p>
          <p style={{ marginTop: 8 }}>Please contact the Super Admin to assign an event to your account.</p>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: theme.backgroundColor }}>
        <ParticipantsPanel event={adminEvent} onClose={() => {}} hideClose />
      </div>
    );
  }

  const save = () => {
    if (!form.name) return;
    if (editId) {
      setEvents(events.map(e => e.id === editId ? { ...e, ...form } as EventData : e));
    } else {
      const newEvt: EventData = {
        id: `evt-${Date.now()}`,
        name: form.name!,
        date: form.date ?? "",
        location: form.location ?? "",
        description: form.description ?? "",
        active: form.active ?? true,
        cardCount: 0,
      };
      setEvents([...events, newEvt]);
    }
    setShowForm(false);
  };

  const del = (id: string) => { setEvents(events.filter(e => e.id !== id)); setDeleteId(null); };
  const getAdminCount = (eventId: string) => users.filter(u => {
    const ids = Array.isArray(u.eventId) ? u.eventId : (u.eventId ? [u.eventId] : []);
    return ids.includes(eventId);
  }).length;
  const getParticipantCount = (eventId: string) => cards.filter(c => c.event_id === eventId).length;
  const getLayoutDoneCount = (eventId: string) => cards.filter(c => c.event_id === eventId && c.layout_done).length;

  const stats = [
    { label: "Total Events", value: visibleEvents.length, color: theme.primaryColor, icon: <CalendarDays size={16} /> },
    { label: "Active Events", value: visibleEvents.filter(e => e.active).length, color: "#10b981", icon: <Calendar size={16} /> },
    { label: "Total Participants", value: cards.filter(c => visibleEvents.some(e => e.id === c.event_id)).length, color: "#0ea5e9", icon: <Users size={16} /> },
  ];

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.07em", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "9px 12px", color: theme.textColor, fontSize: 13, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
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

      {/* Table card */}
      <div style={{ borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}`, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, padding: "16px 20px", flexWrap: "wrap", borderBottom: `1px solid ${theme.borderColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: `1px solid ${theme.borderColor}`, borderRadius: R, padding: "0 12px" }}>
            <Search size={14} style={{ color: theme.textMutedColor, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
              style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, flex: 1, padding: "9px 0" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={12} /></button>}
          </div>
          {isSuperadmin && (
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              <Plus size={14} /> Add Event
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                <ThCol label="EVENT NAME" field="name" col={col as string} dir={dir} onToggle={() => toggle("name")} />
                <ThCol label="DATE" field="date" col={col as string} dir={dir} onToggle={() => toggle("date")} />
                <th style={{ padding: "10px 14px", color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textAlign: "left" }}>LOCATION</th>
                <th style={{ padding: "10px 14px", color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textAlign: "left" }}>ADMINS</th>
                <th style={{ padding: "10px 14px", color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textAlign: "left" }}>PARTICIPANTS</th>
                <ThCol label="STATUS" field="active" col={col as string} dir={dir} onToggle={() => toggle("active")} />
                <th style={{ padding: "10px 14px", width: 160, color: theme.textMutedColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: theme.textMutedColor, fontSize: 13 }}>No events found</td></tr>
              )}
              {sorted.map((ev, i) => {
                const total = getParticipantCount(ev.id);
                const done = getLayoutDoneCount(ev.id);
                return (
                  <motion.tr key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: `1px solid ${theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }} className="table-row-hover">
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.textColor }}>{ev.name}</div>
                      <div style={{ fontSize: 11, color: theme.textMutedColor, marginTop: 2 }}>{ev.description}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.textMutedColor }}>
                        <Calendar size={11} />{ev.date}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.textMutedColor }}>
                        <MapPin size={11} />{ev.location}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: theme.primaryColor }}>{getAdminCount(ev.id)}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9" }}>{total}</span>
                        {total > 0 && (
                          <span style={{ fontSize: 10, color: done === total ? "#10b981" : theme.textMutedColor, fontWeight: 600 }}>
                            ({done}/{total} done)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}><StatusPill active={ev.active} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {/* View Participants */}
                        <button onClick={() => setParticipantsEvent(ev)} title="View participants"
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: R, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                          <Users size={11} /> Participants
                        </button>
                        {isSuperadmin && (
                          <>
                            <button onClick={() => openEdit(ev)}
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primaryColor}14`, color: theme.primaryColor, border: "none", cursor: "pointer" }}>
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => setDeleteId(ev.id)}
                              style={{ width: 28, height: 28, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "none", cursor: "pointer" }}>
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participants Panel */}
      <AnimatePresence>
        {participantsEvent && (
          <ParticipantsPanel event={participantsEvent} onClose={() => setParticipantsEvent(null)} />
        )}
      </AnimatePresence>

      {/* Add/Edit Event panel */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex justify-end"
            style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setShowForm(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 380, height: "100%", background: theme.cardColor, borderLeft: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${theme.borderColor}` }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: theme.textColor }}>{editId ? "Edit Event" : "Add Event"}</span>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, display: "flex" }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>EVENT NAME</label>
                  <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Annual Summit 2025" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DATE</label>
                  <input type="date" value={form.date ?? ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>LOCATION</label>
                  <input value={form.location ?? ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="San Francisco, CA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DESCRIPTION</label>
                  <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…"
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: R, border: `1px solid ${theme.borderColor}` }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: theme.textColor }}>Active</span>
                  <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.active ? theme.primaryColor : theme.textMutedColor }}>
                    {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  <button onClick={save} style={{ flex: 1, padding: "9px", borderRadius: R, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <Check size={13} style={{ display: "inline", marginRight: 4 }} />Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete event modal */}
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
                  <p style={{ fontSize: 15, fontWeight: 700, color: theme.textColor, margin: "0 0 4px" }}>Delete Event</p>
                  <p style={{ fontSize: 13, color: theme.textMutedColor, margin: 0 }}>Remove <strong style={{ color: theme.textColor }}>{events.find(e => e.id === deleteId)?.name}</strong>? All associated cards will be unlinked.</p>
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
