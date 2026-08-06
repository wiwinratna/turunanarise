import React from "react";
import { motion } from "motion/react";
import { X, Download } from "lucide-react";
import { ThemeConfig } from "./AppContext";

interface CardPreviewDialogProps {
  viewCard: any;
  eventLayout: any;
  theme: ThemeConfig;
  onClose: () => void;
  onDownload: () => void;
}

export function CardPreviewDialog({ viewCard, eventLayout, theme, onClose, onDownload }: CardPreviewDialogProps) {
  let CARD_W = 360, CARD_H = 210;
  if (eventLayout?.card_orientation?.startsWith("custom_")) {
    const parts = eventLayout.card_orientation.split("_");
    CARD_W = Number(parts[1]) || 260;
    CARD_H = Number(parts[2]) || 360;
  } else {
    const SIZES: Record<string, { width: number; height: number }> = { landscape: { width: 360, height: 210 }, portrait: { width: 210, height: 360 }, square: { width: 260, height: 260 } };
    const orientation = (eventLayout?.card_orientation ?? "landscape") as keyof typeof SIZES;
    CARD_W = SIZES[orientation].width;
    CARD_H = SIZES[orientation].height;
  }

  const R = 6;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center modal-overlay"
      style={{ background: "rgba(0,0,0,0.75)", position: 'fixed', left: 0, right: 0, top: 0, bottom: 0 }} onClick={onClose}
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
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor }}><X size={18} /></button>
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
            onClick={onDownload}
            style={{ flex: 1, padding: "8px", borderRadius: R, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Download size={13} /> Download PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
