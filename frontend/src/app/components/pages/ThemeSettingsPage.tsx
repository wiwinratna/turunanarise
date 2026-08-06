import { useState } from "react";
import { motion } from "motion/react";
import { useApp, PRESET_THEMES, ThemeConfig } from "../AppContext";
import { Check, Palette, RefreshCw } from "lucide-react";

const R = 6;

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { theme } = useApp();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${theme.borderColor}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: R - 2, background: value, border: `1px solid ${theme.borderColor}`, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.textColor }}>{label}</div>
          <div style={{ fontSize: 11, color: theme.textMutedColor, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
        </div>
      </div>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 34, height: 34, borderRadius: R - 2, border: "none", cursor: "pointer", padding: 2, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }} />
    </div>
  );
}

export function ThemeSettingsPage() {
  const { theme, setTheme } = useApp();
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    // Find matching preset key if possible
    const match = Object.entries(PRESET_THEMES).find(([_, p]) => p.primaryColor === theme.primaryColor && p.backgroundColor === theme.backgroundColor && p.cardColor === theme.cardColor);
    return match ? match[0] : null;
  });

  const applyPreset = (key: string) => {
    setActivePreset(key);
    setTheme(PRESET_THEMES[key]);
  };

  const updateColor = (key: keyof ThemeConfig) => (val: any) => {
    setActivePreset(null);
    setTheme({ ...theme, [key]: val });
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: R * 2, background: theme.cardColor, border: `1px solid ${theme.borderColor}` }}>
          <div style={{ width: 34, height: 34, borderRadius: R, background: `${theme.primaryColor}18`, color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Palette size={18} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: theme.textColor, margin: 0 }}>Theme Customisation</h2>
            <p style={{ fontSize: 12, color: theme.textMutedColor, margin: 0 }}>Changes apply instantly across the entire platform</p>
          </div>
        </div>
        <button onClick={() => applyPreset("midnight")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: theme.textColor, border: `1px solid ${theme.borderColor}`, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {/* Preset Themes Full Width */}
      <div style={{ borderRadius: R * 2, padding: "20px 22px", background: theme.cardColor, border: `1px solid ${theme.borderColor}` }}>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: theme.textColor, margin: "0 0 14px" }}>Preset Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(PRESET_THEMES).map(([key, preset]) => (
                <motion.button key={key} whileTap={{ scale: 0.97 }} onClick={() => applyPreset(key)}
                  style={{
                    position: "relative", display: "flex", flexDirection: "column", gap: 12,
                    padding: "16px", borderRadius: R * 2, cursor: "pointer", textAlign: "left", border: "none",
                    width: "100%", height: "100%",
                    background: activePreset === key ? `${preset.primaryColor}12` : theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    boxShadow: activePreset === key ? `inset 0 0 0 2px ${preset.primaryColor}` : `inset 0 0 0 1px ${theme.borderColor}`,
                    transition: "all 0.2s"
                  }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                       <span style={{ fontSize: 16, flexShrink: 0 }}>{preset.icon}</span>
                       <span style={{ fontSize: 13, fontWeight: 600, color: theme.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preset.name}</span>
                    </div>
                    {activePreset === key && (
                      <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", background: preset.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: 6, marginTop: "auto", alignItems: "center" }}>
                    {[preset.sidebarColor, preset.primaryColor, preset.cardColor].map((c, i) => (
                      <div key={i} title={["Sidebar", "Primary", "Card"][i]} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: `2px solid ${theme.cardColor}`, boxShadow: theme.isDark ? "0 0 0 1px rgba(255,255,255,0.1)" : "0 0 0 1px rgba(0,0,0,0.05)" }} />
                    ))}
                    <div style={{ fontSize: 10, color: theme.textMutedColor, fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>
                      {preset.primaryColor}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

      <div className="grid lg:grid-cols-2 gap-5">
          {/* App mockup */}
          <div style={{ borderRadius: R * 2, padding: "20px 22px", background: theme.cardColor, border: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: theme.textColor, margin: "0 0 14px" }}>Live Preview</h3>
            <div style={{ borderRadius: R, overflow: "hidden", border: `1px solid ${theme.borderColor}`, minHeight: 240, flex: 1 }}>
              <div style={{ display: "flex", height: "100%" }}>
                <div style={{ width: 42, background: theme.sidebarColor, borderRight: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 36, borderBottom: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: theme.primaryColor }} />
                  </div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 3, background: i === 1 ? theme.primaryColor : theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, background: theme.backgroundColor, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 36, background: theme.headerColor, borderBottom: `1px solid ${theme.borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
                    <div style={{ height: 8, width: 60, borderRadius: 2, background: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
                    <div style={{ height: 20, width: 44, borderRadius: R - 2, background: theme.primaryColor }} />
                  </div>
                  <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[0.9, 0.6, 0.75].map((o, i) => (
                      <div key={i} style={{ borderRadius: R, padding: "8px 10px", background: theme.cardColor, border: `1px solid ${theme.borderColor}` }}>
                        <div style={{ height: 6, borderRadius: 2, width: `${o * 80}%`, background: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)", marginBottom: 4 }} />
                        <div style={{ height: 4, borderRadius: 2, width: `${o * 55}%`, background: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />
                      </div>
                    ))}
                    <div style={{ height: 20, borderRadius: R - 2, background: `${theme.primaryColor}30` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Custom colors */}
        <div style={{ borderRadius: R * 2, padding: "20px 22px", background: theme.cardColor, border: `1px solid ${theme.borderColor}`, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: theme.textColor, margin: "0 0 4px" }}>Custom Colours</h3>
          <p style={{ fontSize: 12, color: theme.textMutedColor, margin: "0 0 14px" }}>Fine-tune individual colours or build your own theme</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "space-between" }}>
              <ColorSwatch label="Sidebar" value={theme.sidebarColor} onChange={updateColor("sidebarColor")} />
              <ColorSwatch label="Header" value={theme.headerColor} onChange={updateColor("headerColor")} />
              <ColorSwatch label="Primary / Buttons" value={theme.primaryColor} onChange={updateColor("primaryColor")} />
              <ColorSwatch label="Background" value={theme.backgroundColor} onChange={updateColor("backgroundColor")} />
              <ColorSwatch label="Card Surface" value={theme.cardColor} onChange={updateColor("cardColor")} />
            </div>
          </div>
        </div>
      </div>
  );
}
