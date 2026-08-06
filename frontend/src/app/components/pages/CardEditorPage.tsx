import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, CardElement } from "../AppContext";
import { WhatsAppDialog } from "../WhatsAppDialog";
import { apiUpdateCardLayout, apiGetCard, apiGetEventLayout, apiSaveEventLayout } from "../../api";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  Type, Image, Award, Minus, Plus, Trash2, ChevronUp, ChevronDown,
  Download, Save, RotateCcw, Layers, Eye, EyeOff, Square,
  Upload, Grid, Move, FileImage, FileText, MessageCircle, Check, X, ArrowLeft,
  AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut
} from "lucide-react";

const CARD_SIZES = {
  landscape: { width: 360, height: 210, label: "Landscape (CR-80)" },
  portrait: { width: 210, height: 360, label: "Portrait" },
  square: { width: 260, height: 260, label: "Square" },
};

function ElementOnCanvas({ el, selected, participantData, zoom = 1, onSelect, onUpdate }: {
  el: CardElement;
  selected: boolean;
  participantData?: Record<string, any> | null;
  zoom?: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<CardElement>) => void;
}) {
  const { theme } = useApp();
  const dragRef = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; elW: number; elH: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (me.clientX - dragRef.current.startX) / zoom;
      const dy = (me.clientY - dragRef.current.startY) / zoom;
      onUpdate({ x: Math.max(0, dragRef.current.elX + dx), y: Math.max(0, dragRef.current.elY + dy) });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, elX: el.x, elY: el.y };

    const onMove = (te: TouchEvent) => {
      if (!dragRef.current) return;
      const touchMove = te.touches[0];
      const dx = (touchMove.clientX - dragRef.current.startX) / zoom;
      const dy = (touchMove.clientY - dragRef.current.startY) / zoom;
      onUpdate({ x: Math.max(0, dragRef.current.elX + dx), y: Math.max(0, dragRef.current.elY + dy) });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, elW: el.width, elH: el.height };
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = (me.clientX - resizeRef.current.startX) / zoom;
      const dh = (me.clientY - resizeRef.current.startY) / zoom;
      onUpdate({ width: Math.max(10, resizeRef.current.elW + dw), height: Math.max(10, resizeRef.current.elH + dh) });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    resizeRef.current = { startX: touch.clientX, startY: touch.clientY, elW: el.width, elH: el.height };
    const onMove = (te: TouchEvent) => {
      if (!resizeRef.current) return;
      const touchMove = te.touches[0];
      const dw = (touchMove.clientX - resizeRef.current.startX) / zoom;
      const dh = (touchMove.clientY - resizeRef.current.startY) / zoom;
      onUpdate({ width: Math.max(10, resizeRef.current.elW + dw), height: Math.max(10, resizeRef.current.elH + dh) });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const commonStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    cursor: "move",
    outline: selected ? "2px solid #7c5cfc" : "none",
    outlineOffset: 2,
    borderRadius: el.borderRadius ?? 0,
    boxSizing: "border-box",
    userSelect: "none",
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  };

  if (el.hidden && !selected) return null;

  let displayContent = el.content;
  if (el.dataField && participantData) {
    if (el.dataField === "fullName") displayContent = `${participantData.firstName || ''} ${participantData.lastName || ''}`.trim() || el.content;
    else if (el.dataField === "categoryName" && participantData.categoryName) displayContent = participantData.categoryName;
    else if (el.dataField === "functionName" && participantData.functionName) displayContent = participantData.functionName;
    else displayContent = participantData[el.dataField] || el.content;
  }

  let displayImage = el.imageUrl;
  if (el.dataField && participantData && participantData[el.dataField]) {
    displayImage = participantData[el.dataField];
  }

  return (
    <div style={{ ...commonStyle, opacity: el.hidden ? 0.4 : 1 }} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} onClick={e => e.stopPropagation()}>
      {el.type === "text" && (
        <div style={{
          fontSize: el.fontSize ?? 12, fontWeight: el.fontWeight ?? "400",
          fontFamily: el.fontFamily ?? "sans-serif",
          color: el.color ?? "#f0f0fa", width: "100%", height: "100%",
          display: "flex", alignItems: "center",
          lineHeight: 1.2,
          justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
          textAlign: el.textAlign ?? "left"
        }}>
          {displayContent}
        </div>
      )}
      {el.type === "photo" && (
        displayImage
          ? <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: el.borderRadius ?? 0, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"}` : "none", boxSizing: "border-box" }}>
              <img src={displayImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
            </div>
          : <div style={{ width: "100%", height: "100%", background: "rgba(124,92,252,0.2)", borderRadius: el.borderRadius ?? 0, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"}` : "2px dashed rgba(124,92,252,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <Image size={20} style={{ color: "#7c5cfc" }} />
          </div>
      )}
      {el.type === "logo" && (
        displayImage
          ? <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: el.borderRadius ?? 0, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"}` : "none", boxSizing: "border-box" }}>
              <img src={displayImage} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} crossOrigin="anonymous" />
            </div>
          : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)", borderRadius: el.borderRadius ?? 6, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"}` : "2px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <Upload size={14} style={{ color: theme.textMutedColor }} />
          </div>
      )}
      {el.type === "badge" && (
        <div style={{ width: "100%", height: "100%", background: el.bgColor ?? "#7c5cfc", borderRadius: el.borderRadius ?? 4, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
          <span style={{ fontSize: el.fontSize ?? 9, fontWeight: 700, color: el.color ?? "#fff", lineHeight: 1, display: "inline-block" }}>{displayContent}</span>
        </div>
      )}
      {el.type === "divider" && (
        <div style={{ width: "100%", height: "100%", background: el.bgColor ?? "rgba(255,255,255,0.1)" }} />
      )}
      {el.type === "shape" && (
        <div style={{ width: "100%", height: "100%", background: el.bgColor ?? "#7c5cfc", borderRadius: el.borderRadius ?? 0, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor ?? "#e53e5e"}` : "none", boxSizing: "border-box" }} />
      )}

      {/* Resize handle */}
      {selected && (
        <div onMouseDown={handleResizeDown} onTouchStart={handleResizeTouch}
          style={{ position: "absolute", right: -4, bottom: -4, width: 10, height: 10, background: "#7c5cfc", borderRadius: 2, cursor: "se-resize", zIndex: 10 }} />
      )}
    </div>
  );
}

export function CardEditorPage() {
  const { currentUser, cardElements, setCardElements, formData, theme, cardOrientation, setCardOrientation, cardBgImage, setCardBgImage, saveCard, activeCardId, setActiveCardId, setCards, cards, setPage, activeEventId, setActiveEventId } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [activePanel, setActivePanel] = useState<"elements" | "properties" | "layers">("elements");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("My Card");
  const [cardBg, setCardBg] = useState("#ffffff");
  const [customWidth, setCustomWidth] = useState(260);
  const [customHeight, setCustomHeight] = useState(360);
  const [showGrid, setShowGrid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCardName, setActiveCardName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const cardCanvasRef = useRef<HTMLDivElement>(null);

  const initializeDefaultElements = useCallback((name: string, participantData: any): CardElement[] => {
    return [];
  }, []);

  // Load card data if opened from participant list
  useEffect(() => {
    if (!activeCardId) return;
    const existing = cards.find(c => c.id === activeCardId);
    if (existing) {
      const layout = (existing.layout_json && existing.layout_json.length > 0)
        ? (existing.layout_json as CardElement[])
        : initializeDefaultElements(existing.name, existing.participant_data);
      setCardElements(layout);
      setCardOrientation(existing.card_orientation ?? "landscape");
      if (existing.card_orientation?.startsWith("custom_")) {
        const parts = existing.card_orientation.split("_");
        setCustomWidth(Number(parts[1]) || 260);
        setCustomHeight(Number(parts[2]) || 360);
      }
      const elements = layout as any[] || [];
      const bgElem = elements.find(e => e.id === "system-bg-image");
      setCardBgImage(bgElem?.imageUrl || null);
      setCardElements(elements.filter(e => e.id !== "system-bg-image"));
      setCardBg(existing.background_color ?? "#ffffff");
      setSaveName(existing.name);
      setActiveCardName(existing.name);
    } else {
      // Fallback: fetch from API
      apiGetCard(activeCardId).then(card => {
        const layout = (card.layout_json && card.layout_json.length > 0)
          ? (card.layout_json as CardElement[])
          : initializeDefaultElements(card.name, card.participant_data);
        setCardOrientation(card.card_orientation ?? "landscape");
        if (card.card_orientation?.startsWith("custom_")) {
          const parts = card.card_orientation.split("_");
          setCustomWidth(Number(parts[1]) || 260);
          setCustomHeight(Number(parts[2]) || 360);
        }
        const elements = layout as any[] || [];
        const bgElem = elements.find(e => e.id === "system-bg-image");
        setCardBgImage(bgElem?.imageUrl || null);
        setCardElements(elements.filter(e => e.id !== "system-bg-image"));
        setCardBg(card.background_color ?? "#ffffff");
        setSaveName(card.name);
        setActiveCardName(card.name);
      }).catch(() => {});
    }
  }, [activeCardId, cards, initializeDefaultElements]);

  // Load event template layout if no active card is selected
  useEffect(() => {
    if (activeCardId) return;

    let targetEventId = activeEventId;
    if (!targetEventId && currentUser && currentUser.role !== "superadmin") {
      targetEventId = Array.isArray(currentUser.eventId) ? currentUser.eventId[0] : (currentUser.eventId as string | null);
    }

    if (targetEventId) {
      apiGetEventLayout(targetEventId).then(layoutData => {
        if (layoutData.has_layout) {
          setCardOrientation(layoutData.card_orientation ?? "landscape");
          if (layoutData.card_orientation?.startsWith("custom_")) {
            const parts = layoutData.card_orientation.split("_");
            setCustomWidth(Number(parts[1]) || 260);
            setCustomHeight(Number(parts[2]) || 360);
          }
          setCardBg(layoutData.background_color ?? "#ffffff");
          const elements = layoutData.elements as any[] || [];
          const bgElem = elements.find(e => e.id === "system-bg-image");
          setCardBgImage(bgElem?.imageUrl || null);
          setCardElements(elements.filter(e => e.id !== "system-bg-image"));
        } else {
          // Reset to default blank canvas
          setCardElements([]);
          setCardOrientation("landscape");
          setCardBg("#ffffff");
          setCardBgImage(null);
        }
      }).catch(() => {});
    } else if (!activeCardId && !targetEventId) {
      // Complete fallback (e.g. superadmin making standalone template)
      setCardElements([]);
      setCardOrientation("landscape");
      setCardBg("#ffffff");
      setCardBgImage(null);
    }
  }, [activeCardId, activeEventId, currentUser, setCardElements, setCardOrientation, setCardBg, setCardBgImage]);

  const handleBackToEvents = () => {
    setActiveCardId(null);
    setActiveEventId(null);
    setPage("events");
  };

  const handleSaveLayout = async () => {
    let targetEventId = activeEventId;
    if (!targetEventId && currentUser && currentUser.role !== "superadmin") {
      targetEventId = Array.isArray(currentUser.eventId) ? currentUser.eventId[0] : (currentUser.eventId as string | null);
    }

    // If we have an event context, save as event template
    if (targetEventId) {
      setIsSaving(true);
      try {
        const payloadElements = [...(cardElements as any[])];
        if (cardBgImage) {
          payloadElements.push({ id: "system-bg-image", type: "system-bg-image", imageUrl: cardBgImage, hidden: true });
        }
        await apiSaveEventLayout(targetEventId, {
          elements: payloadElements,
          card_orientation: cardOrientation,
          background_color: cardBg,
        });
        // Also update the card's orientation/bg in case it changed
        if (activeCardId) {
          const updated = await apiUpdateCardLayout(activeCardId, {
            elements: payloadElements,
            card_orientation: cardOrientation,
            background_color: cardBg,
          });
          setCards(cards.map(c => c.id === activeCardId ? updated : c));
        }
        toast.success("Event template layout saved! All participant cards updated.");
        setShowSaveDialog(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to save template");
      } finally {
        setIsSaving(false);
      }
      return;
    }
    // Fallback: save per-card layout
    if (!activeCardId) {
      setShowSaveDialog(true);
      return;
    }
    setIsSaving(true);
    try {
      const payloadElements = [...(cardElements as any[])];
      if (cardBgImage) {
        payloadElements.push({ id: "system-bg-image", type: "system-bg-image", imageUrl: cardBgImage, hidden: true });
      }
      const updated = await apiUpdateCardLayout(activeCardId, {
        elements: payloadElements,
        card_orientation: cardOrientation,
        background_color: cardBg,
      });
      setCards(cards.map(c => c.id === activeCardId ? updated : c));
      toast.success("Card layout saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  const getCardSize = () => {
    if (cardOrientation.startsWith("custom_")) return { width: customWidth, height: customHeight, label: "Custom" };
    return CARD_SIZES[cardOrientation as keyof typeof CARD_SIZES] || CARD_SIZES["landscape"];
  };
  const cardSize = getCardSize();
  const selected = cardElements.find(e => e.id === selectedId);
  const activeCard = cards.find(c => c.id === activeCardId);
  const participantData = activeCard?.participant_data;

  const updateEl = useCallback((id: string, updates: Partial<CardElement>) => {
    setCardElements(cardElements.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [cardElements, setCardElements]);

  const deleteEl = useCallback((id: string) => {
    setCardElements(cardElements.filter(e => e.id !== id));
    setSelectedId(null);
  }, [cardElements, setCardElements]);

  const bringForward = (id: string) => {
    setCardElements(cardElements.map(e => e.id === id ? { ...e, layer: e.layer + 1 } : e));
  };

  const sendBackward = (id: string) => {
    setCardElements(cardElements.map(e => e.id === id ? { ...e, layer: Math.max(0, e.layer - 1) } : e));
  };

  const addElement = (type: CardElement["type"], dataField?: string, defaultContent?: string) => {
    const newEl: CardElement = {
      id: `el-${Date.now()}`,
      type,
      x: 20,
      y: 20,
      width: type === "text" ? 150 : type === "badge" ? 80 : type === "divider" ? 200 : type === "shape" ? 100 : 60,
      height: type === "text" ? 24 : type === "badge" ? 24 : type === "divider" ? 2 : type === "shape" ? 100 : 60,
      content: type === "text" ? (defaultContent || "New text") : type === "badge" ? "BADGE" : "",
      fontSize: type === "text" ? 13 : type === "badge" ? 9 : undefined,
      color: type === "text" ? "#333333" : "#f0f0fa",
      bgColor: type === "badge" || type === "shape" ? theme.primaryColor : type === "divider" ? "rgba(0,0,0,0.1)" : undefined,
      borderRadius: type === "photo" ? 50 : type === "badge" ? 4 : type === "shape" ? 12 : 0,
      layer: Math.max(...cardElements.map(e => e.layer), 0) + 1,
      dataField,
    };
    setCardElements([...cardElements, newEl]);
    setSelectedId(newEl.id);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "logo" | "bg") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (type === "bg") {
        setCardBgImage(url);
      } else if (selectedId) {
        updateEl(selectedId, { imageUrl: url });
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Export Functions ───────────────────────────────────────────────────
  const captureCanvas = async (): Promise<string | null> => {
    if (!cardCanvasRef.current) return null;
    setSelectedId(null); // Deselect to hide outlines
    await new Promise(r => setTimeout(r, 100)); // Wait for re-render
    
    // Temporarily strip the scale transform from the wrapper so html-to-image doesn't freak out
    const wrapperEl = document.getElementById("card-canvas-export");
    const originalTransform = wrapperEl ? wrapperEl.style.transform : "";
    if (wrapperEl) wrapperEl.style.transform = "none";
    
    let dataUrl = null;
    try {
      dataUrl = await toPng(cardCanvasRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        style: { fontFamily: "'Poppins', 'Inter', sans-serif" }
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (wrapperEl) wrapperEl.style.transform = originalTransform;
    }
    return dataUrl;
  };

  const exportPNG = async () => {
    setExporting(true);
    setShowExportMenu(false);
    const dataUrl = await captureCanvas();
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `${saveName.replace(/[^a-zA-Z0-9]/g, "_")}_card.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess("PNG");
      setTimeout(() => setExportSuccess(null), 2500);
    }
    setExporting(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    setShowExportMenu(false);
    const dataUrl = await captureCanvas();
    if (dataUrl) {
      const pdf = new jsPDF({
        orientation: cardOrientation === "portrait" ? "portrait" : "landscape",
        unit: "px",
        format: [cardSize.width * 2, cardSize.height * 2],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, cardSize.width * 2, cardSize.height * 2);
      pdf.save(`${saveName.replace(/[^a-zA-Z0-9]/g, "_")}_card.pdf`);
      setExportSuccess("PDF");
      setTimeout(() => setExportSuccess(null), 2500);
    }
    setExporting(false);
  };

  const sortedElements = [...cardElements].sort((a, b) => a.layer - b.layer);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left Panel */}
      <div className="flex flex-col flex-shrink-0 overflow-y-auto" style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", background: theme.cardColor }}>
        {/* Panel Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["elements", "properties", "layers"] as const).map(p => (
            <button key={p} onClick={() => setActivePanel(p)}
              style={{
                flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                background: activePanel === p ? `${theme.primaryColor}20` : "none",
                color: activePanel === p ? theme.primaryColor : "#7070a0",
                borderBottom: activePanel === p ? `2px solid ${theme.primaryColor}` : "2px solid transparent"
              }}>
              {p}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activePanel === "elements" && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.1em", marginBottom: 12 }}>ADD ELEMENT</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { type: "text" as const, icon: <Type size={16} />, label: "Text" },
                  { type: "photo" as const, icon: <Image size={16} />, label: "Photo" },
                  { type: "logo" as const, icon: <Upload size={16} />, label: "Logo" },
                  { type: "badge" as const, icon: <Award size={16} />, label: "Badge" },
                  { type: "shape" as const, icon: <Square size={16} />, label: "Shape" },
                  { type: "divider" as const, icon: <Minus size={16} />, label: "Line" },
                ].map(item => (
                  <button key={item.type} onClick={() => addElement(item.type)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", color: theme.textColor }}>
                    <span style={{ color: theme.primaryColor }}>{item.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                  </button>
                ))}
              </div>


              <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.1em", marginBottom: 12 }}>CARD SIZE</p>
              <div className="grid grid-cols-2 gap-2">
              {(["landscape", "portrait", "square", "custom"] as const).map(o => {
                const isCustom = o === "custom";
                const isSelected = isCustom ? cardOrientation.startsWith("custom_") : cardOrientation === o;
                return (
                <button key={o} onClick={() => {
                  if (isCustom) {
                    setCardOrientation(`custom_${customWidth}_${customHeight}`);
                  } else {
                    setCardOrientation(o);
                  }
                }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg transition-all"
                  style={{
                    background: isSelected ? `${theme.primaryColor}20` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? theme.primaryColor + "50" : "rgba(255,255,255,0.07)"}`,
                    cursor: "pointer", color: isSelected ? theme.primaryColor : "#9090b8"
                  }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", marginBottom: 2 }}>{o}</span>
                  <span style={{ fontSize: 9, color: theme.textMutedColor }}>{isCustom ? `${customWidth}×${customHeight}` : `${CARD_SIZES[o as keyof typeof CARD_SIZES].width}×${CARD_SIZES[o as keyof typeof CARD_SIZES].height}`}</span>
                </button>
              )})}
              </div>

              {cardOrientation.startsWith("custom_") && (
                <div className="flex gap-2 mt-2">
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>WIDTH</label>
                    <input type="number" value={customWidth}
                      onChange={e => {
                        const w = Number(e.target.value);
                        setCustomWidth(w);
                        setCardOrientation(`custom_${w}_${customHeight}`);
                      }}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>HEIGHT</label>
                    <input type="number" value={customHeight}
                      onChange={e => {
                        const h = Number(e.target.value);
                        setCustomHeight(h);
                        setCardOrientation(`custom_${customWidth}_${h}`);
                      }}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.1em", marginBottom: 8 }}>CARD BACKGROUND</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input type="color" value={cardBg} onChange={e => setCardBg(e.target.value)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: "none", padding: 2 }} />
                    <input value={cardBg} onChange={e => setCardBg(e.target.value)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: theme.textColor, fontSize: 12, outline: "none" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="file" accept="image/*" ref={bgInputRef} onChange={e => handlePhotoUpload(e, "bg")} style={{ display: "none" }} />
                    <button onClick={() => bgInputRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: theme.textColor, fontSize: 11, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                      <FileImage size={14} /> {cardBgImage ? "Change Image" : "Upload Image"}
                    </button>
                    {cardBgImage && (
                      <button onClick={() => setCardBgImage(null)} style={{ padding: "8px", borderRadius: 8, background: "rgba(229,62,94,0.1)", border: "1px solid rgba(229,62,94,0.2)", color: "#e53e5e", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePanel === "properties" && selected && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.1em", marginBottom: 12 }}>ELEMENT PROPERTIES</p>

              <div className="flex flex-col gap-3">
                {/* Position */}
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: 10, color: theme.textMutedColor, marginBottom: 8 }}>POSITION & SIZE</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "X", key: "x" as const, val: Math.round(selected.x) },
                      { label: "Y", key: "y" as const, val: Math.round(selected.y) },
                      { label: "W", key: "width" as const, val: Math.round(selected.width) },
                      { label: "H", key: "height" as const, val: Math.round(selected.height) },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>{f.label}</label>
                        <input type="number" value={f.val}
                          onChange={e => updateEl(selected.id, { [f.key]: Number(e.target.value) })}
                          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text properties */}
                {selected.type === "text" && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: 10, color: theme.textMutedColor, marginBottom: 8 }}>TEXT</p>
                    <textarea value={selected.content}
                      onChange={e => updateEl(selected.id, { content: e.target.value })}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 60 }} />
                    
                    <div className="mt-2">
                      <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>DATA BINDING</label>
                      <select value={selected.dataField || ""} onChange={e => updateEl(selected.id, { dataField: e.target.value })}
                        style={{ width: "100%", background: theme.inputColor, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none" }}>
                        <option value="">None (Static Text)</option>
                        <option value="fullName">Full Name</option>
                        <option value="title">Title (Mr/Mrs/Ms)</option>
                        <option value="firstName">First Name</option>
                        <option value="lastName">Last Name</option>
                        <option value="gender">Gender</option>
                        <option value="dateOfBirth">Date of Birth</option>
                        <option value="email">Email</option>
                        <option value="mobileNumber">Mobile Number</option>
                        <option value="officeNumber">Office Number</option>
                        <option value="organization">Organization</option>
                        <option value="jobTitle">Job Title</option>
                        <option value="categoryName">Category</option>
                        <option value="functionName">Function</option>
                        <option value="nationality">Nationality</option>
                        <option value="documentType">Document Type</option>
                        <option value="idNumber">Number of ID</option>
                        <option value="issueDate">Issue Date</option>
                        <option value="expirationDate">Expiration Date</option>
                      </select>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>SIZE</label>
                        <input type="number" value={selected.fontSize ?? 12}
                          onChange={e => updateEl(selected.id, { fontSize: Number(e.target.value) })}
                          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>COLOR</label>
                        <input type="color" value={selected.color ?? "#f0f0fa"}
                          onChange={e => updateEl(selected.id, { color: e.target.value })}
                          style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2, background: "rgba(255,255,255,0.06)" }} />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>FONT FAMILY</label>
                        <select value={selected.fontFamily ?? "sans-serif"} onChange={e => updateEl(selected.id, { fontFamily: e.target.value })}
                          style={{ width: "100%", background: theme.inputColor, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none" }}>
                          <option value="sans-serif">Sans-serif (Default)</option>
                          <option value="'Poppins', sans-serif">Poppins</option>
                          <option value="'Inter', sans-serif">Inter</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Open Sans', sans-serif">Open Sans</option>
                          <option value="'Montserrat', sans-serif">Montserrat</option>
                          <option value="serif">Serif</option>
                          <option value="'Merriweather', serif">Merriweather</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>ALIGNMENT</label>
                        <div className="flex gap-1 bg-[#1c1c2e] p-1 rounded-md border border-transparent" style={{ height: 28 }}>
                          {["left", "center", "right"].map(align => (
                            <button key={align} onClick={() => updateEl(selected.id, { textAlign: align as any })}
                              style={{ flex: 1, padding: "4px 0", borderRadius: 4, border: "none", background: selected.textAlign === align || (!selected.textAlign && align === "left") ? theme.primaryColor : "transparent", color: selected.textAlign === align || (!selected.textAlign && align === "left") ? "#fff" : "#7070a0", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                              {align === "left" && <AlignLeft size={12} />}
                              {align === "center" && <AlignCenter size={12} />}
                              {align === "right" && <AlignRight size={12} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>WEIGHT</label>
                        <select value={selected.fontWeight ?? "400"} onChange={e => updateEl(selected.id, { fontWeight: e.target.value })}
                          style={{ width: "100%", background: theme.inputColor, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none" }}>
                          <option value="300">Light</option>
                          <option value="400">Regular</option>
                          <option value="500">Medium</option>
                          <option value="600">Semibold</option>
                          <option value="700">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>ROTATION</label>
                        <select value={selected.rotation ?? 0} onChange={e => updateEl(selected.id, { rotation: Number(e.target.value) })}
                          style={{ width: "100%", background: theme.inputColor, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none" }}>
                          <option value="0">0°</option>
                          <option value="90">90°</option>
                          <option value="180">180°</option>
                          <option value="270">270°</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo / Logo upload */}
                {(selected.type === "photo" || selected.type === "logo") && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: 10, color: theme.textMutedColor, marginBottom: 8 }}>IMAGE</p>
                    <button onClick={() => selected.type === "photo" ? photoInputRef.current?.click() : logoInputRef.current?.click()}
                      className="w-full py-2 rounded-lg"
                      style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor, border: `1px solid ${theme.primaryColor}30`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      <Upload size={12} style={{ display: "inline", marginRight: 4 }} />
                      Upload Image
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => handlePhotoUpload(e, "photo")} />
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => handlePhotoUpload(e, "logo")} />

                    {selected.type === "photo" && (
                      <div className="mt-3">
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>DATA BINDING</label>
                        <select value={selected.dataField || ""} onChange={e => updateEl(selected.id, { dataField: e.target.value })}
                          style={{ width: "100%", background: theme.inputColor, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: theme.textColor, fontSize: 12, outline: "none" }}>
                          <option value="">None (Static Image)</option>
                          <option value="picture">Participant Picture</option>
                          <option value="uploadId">Participant ID Scan</option>
                        </select>
                      </div>
                    )}

                    <div className="mt-3">
                      <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>SHAPE</label>
                      <div className="flex gap-2">
                        <button onClick={() => updateEl(selected.id, { borderRadius: 0 })}
                          style={{ flex: 1, padding: "4px 0", background: selected.borderRadius === 0 ? theme.primaryColor : "rgba(255,255,255,0.06)", color: selected.borderRadius === 0 ? "#fff" : "#c8c8e8", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
                          Square
                        </button>
                        <button onClick={() => updateEl(selected.id, { borderRadius: Math.max(selected.width, selected.height) / 2 })}
                          style={{ flex: 1, padding: "4px 0", background: selected.borderRadius && selected.borderRadius > 10 ? theme.primaryColor : "rgba(255,255,255,0.06)", color: selected.borderRadius && selected.borderRadius > 10 ? "#fff" : "#c8c8e8", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
                          Circle
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 items-center">
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER RADIUS</label>
                        <input type="range" min="0" max={Math.max(selected.width, selected.height) / 2} value={selected.borderRadius ?? 0}
                          onChange={e => updateEl(selected.id, { borderRadius: Number(e.target.value) })}
                          style={{ width: "100%" }} />
                      </div>
                      <input type="number" value={selected.borderRadius ?? 0}
                        onChange={e => updateEl(selected.id, { borderRadius: Number(e.target.value) })}
                        style={{ width: 40, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px", color: theme.textColor, fontSize: 11, outline: "none", textAlign: "center", marginTop: 12 }} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER WIDTH</label>
                        <input type="number" min="0" value={selected.borderWidth ?? 0}
                          onChange={e => updateEl(selected.id, { borderWidth: Number(e.target.value) })}
                          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", color: theme.textColor, fontSize: 11, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER COLOR</label>
                        <input type="color" value={selected.borderColor ?? "#e53e5e"}
                          onChange={e => updateEl(selected.id, { borderColor: e.target.value })}
                          style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2, background: "rgba(255,255,255,0.06)" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Badge */}
                {selected.type === "badge" && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: 10, color: theme.textMutedColor, marginBottom: 8 }}>BADGE</p>
                    <input value={selected.content}
                      onChange={e => updateEl(selected.id, { content: e.target.value })}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", color: theme.textColor, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BG COLOR</label>
                        <input type="color" value={selected.bgColor ?? "#7c5cfc"}
                          onChange={e => updateEl(selected.id, { bgColor: e.target.value })}
                          style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>TEXT COLOR</label>
                        <input type="color" value={selected.color ?? "#fff"}
                          onChange={e => updateEl(selected.id, { color: e.target.value })}
                          style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape */}
                {selected.type === "shape" && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: 10, color: theme.textMutedColor, marginBottom: 8 }}>SHAPE</p>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div>
                        <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>COLOR</label>
                        <input type="color" value={selected.bgColor ?? "#7c5cfc"}
                          onChange={e => updateEl(selected.id, { bgColor: e.target.value })}
                          style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2 }} />
                      </div>
                      <div className="mt-2 flex gap-2 items-center">
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER RADIUS</label>
                          <input type="range" min="0" max={Math.max(selected.width, selected.height) / 2} value={selected.borderRadius ?? 0}
                            onChange={e => updateEl(selected.id, { borderRadius: Number(e.target.value) })}
                            style={{ width: "100%" }} />
                        </div>
                        <input type="number" value={selected.borderRadius ?? 0}
                          onChange={e => updateEl(selected.id, { borderRadius: Number(e.target.value) })}
                          style={{ width: 40, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px", color: theme.textColor, fontSize: 11, outline: "none", textAlign: "center", marginTop: 12 }} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER WIDTH</label>
                          <input type="number" min="0" value={selected.borderWidth ?? 0}
                            onChange={e => updateEl(selected.id, { borderWidth: Number(e.target.value) })}
                            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", color: theme.textColor, fontSize: 11, outline: "none" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: theme.textMutedColor, display: "block", marginBottom: 3 }}>BORDER COLOR</label>
                          <input type="color" value={selected.borderColor ?? "#e53e5e"}
                            onChange={e => updateEl(selected.id, { borderColor: e.target.value })}
                            style={{ width: "100%", height: 28, borderRadius: 6, border: "none", cursor: "pointer", padding: 2, background: "rgba(255,255,255,0.06)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button onClick={() => deleteEl(selected.id)}
                  className="flex items-center gap-2 w-full py-2 rounded-lg justify-center"
                  style={{ background: "rgba(229,62,94,0.1)", color: "#e53e5e", border: "1px solid rgba(229,62,94,0.2)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <Trash2 size={13} /> Delete Element
                </button>
              </div>
            </div>
          )}

          {activePanel === "properties" && !selected && (
            <div style={{ textAlign: "center", padding: "40px 16px", color: theme.textMutedColor }}>
              <Move size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Select an element on the canvas to edit its properties</p>
            </div>
          )}

          {activePanel === "layers" && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMutedColor, letterSpacing: "0.1em", marginBottom: 12 }}>LAYERS ({cardElements.length})</p>
              <div className="flex flex-col gap-1.5">
                {[...cardElements].sort((a, b) => b.layer - a.layer).map(el => (
                  <div key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: selectedId === el.id ? `${theme.primaryColor}20` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedId === el.id ? theme.primaryColor + "40" : "rgba(255,255,255,0.06)"}`,
                      color: selectedId === el.id ? theme.primaryColor : "#c8c8e8"
                    }}>
                    <span style={{ fontSize: 11 }}>
                      {el.type === "text" ? <Type size={12} /> : el.type === "photo" ? <Image size={12} /> : el.type === "badge" ? <Award size={12} /> : el.type === "shape" ? <Square size={12} /> : el.type === "logo" ? <Upload size={12} /> : <Minus size={12} />}
                    </span>
                    <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {el.type === "text" ? el.content.substring(0, 18) : el.type}
                    </span>
                    <div className="flex gap-0.5">
                      <button onClick={e => { e.stopPropagation(); updateEl(el.id, { hidden: !el.hidden }); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: el.hidden ? "#404060" : "#7070a0", padding: 2 }}>
                        {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); bringForward(el.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, padding: 2 }}>
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); sendBackward(el.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, padding: 2 }}>
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: theme.backgroundColor }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: theme.headerColor, borderBottom: `1px solid ${theme.borderColor}` }}>
          <div className="flex items-center gap-2">
            {/* Back button when opened from participant list */}
            {activeCardId && (
              <button onClick={handleBackToEvents}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textMutedColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 12 }}>
                <ArrowLeft size={13} /> Back
              </button>
            )}
            {activeCardName && (
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.textColor, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeCardName}
              </span>
            )}
            <button onClick={() => setShowGrid(!showGrid)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: showGrid ? `${theme.primaryColor}20` : theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: showGrid ? theme.primaryColor : theme.textMutedColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              <Grid size={13} /> Grid
            </button>
            <button onClick={() => setCardElements([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textMutedColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              <RotateCcw size={13} /> Reset
            </button>
            <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-lg" style={{ background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${theme.borderColor}` }}>
              <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} style={{ background: "none", border: "none", color: theme.textMutedColor, cursor: "pointer", padding: 2 }}><ZoomOut size={13} /></button>
              <span style={{ fontSize: 11, color: theme.textColor, width: 36, textAlign: "center", userSelect: "none" }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} style={{ background: "none", border: "none", color: theme.textMutedColor, cursor: "pointer", padding: 2 }}><ZoomIn size={13} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Save */}
            <button onClick={handleSaveLayout} disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
              style={{ background: isSaving ? `${theme.primaryColor}60` : (theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"), color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: isSaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
            <Save size={13} /> {isSaving ? "Saving…" : (activeEventId ? "Save Template" : "Save")}
            </button>

            {/* Export dropdown */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
                style={{ background: theme.primaryColor, color: "#fff", border: "none", cursor: exporting ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: exporting ? 0.7 : 1 }}
                disabled={exporting}>
                {exporting ? (
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
                ) : exportSuccess ? (
                  <><Check size={13} /> {exportSuccess} Saved!</>
                ) : (
                  <><Download size={13} /> Export</>
                )}
              </button>

              <AnimatePresence>
                {showExportMenu && !exporting && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    style={{
                      position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
                      background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: 8,
                      padding: 4, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                    }}>
                    <button onClick={exportPNG}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      style={{ background: "none", border: "none", cursor: "pointer", color: theme.textColor, fontSize: 13, textAlign: "left" }}>
                      <FileImage size={15} style={{ color: "#0ea5e9" }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Export PNG</div>
                        <div style={{ fontSize: 10, color: theme.textMutedColor }}>High-res image</div>
                      </div>
                    </button>
                    <button onClick={exportPDF}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      style={{ background: "none", border: "none", cursor: "pointer", color: theme.textColor, fontSize: 13, textAlign: "left" }}>
                      <FileText size={15} style={{ color: "#e53e5e" }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Export PDF</div>
                        <div style={{ fontSize: 10, color: theme.textMutedColor }}>Print-ready document</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto relative p-8 flex items-center justify-center"
          style={{ background: theme.isDark ? "#0a0a14" : "#e2e8f0" }}
          onClick={() => { setShowExportMenu(false); }}>
          <div id="card-canvas-export" onClick={() => setSelectedId(null)} style={{ position: "relative", flexShrink: 0, transform: `scale(${zoom})`, transformOrigin: "center center" }}>
            <div
              ref={cardCanvasRef}
              style={{
                width: cardSize.width,
                height: cardSize.height,
                background: cardBg,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08)",
                backgroundImage: cardBgImage ? `url(${cardBgImage})` : showGrid
                  ? "linear-gradient(rgba(128,128,128,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.25) 1px, transparent 1px)"
                  : undefined,
                backgroundSize: cardBgImage ? "cover" : showGrid ? "20px 20px" : undefined,
                backgroundPosition: "center",
                transformOrigin: "center center"
              }}>
              {sortedElements.map(el => (
                <ElementOnCanvas
                  key={el.id}
                  el={el}
                  selected={selectedId === el.id}
                  zoom={zoom}
                  onSelect={() => { setSelectedId(el.id); setActivePanel("properties"); }}
                  onUpdate={updates => updateEl(el.id, updates)}
                  participantData={participantData}
                />
              ))}
            </div>
            {/* Size label */}
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: theme.textMutedColor }}>
              {cardSize.label} · {cardSize.width}×{cardSize.height}px
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowSaveDialog(false)}>
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: theme.cardColor, border: `1px solid ${theme.borderColor}`, borderRadius: 10, padding: "24px", width: 320 }}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: theme.textColor, margin: "0 0 14px" }}>Save Card</h3>
              <input value={saveName} onChange={e => setSaveName(e.target.value)}
                placeholder="Card name..."
                style={{ width: "100%", background: theme.inputColor, border: `1px solid ${theme.borderColor}`, borderRadius: 6, padding: "10px 12px", color: theme.textColor, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowSaveDialog(false)}
                  style={{ flex: 1, padding: "9px", borderRadius: 6, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={() => { saveCard(saveName); setShowSaveDialog(false); }}
                  style={{ flex: 1, padding: "9px", borderRadius: 6, background: theme.primaryColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Dialog */}
      <WhatsAppDialog
        open={showWhatsApp}
        onClose={() => setShowWhatsApp(false)}
        cardName={saveName}
        cardId={activeCardId}
        theme={theme}
      />
    </div>
  );
}
