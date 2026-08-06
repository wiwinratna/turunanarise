import { Bell, Search, Plus, Menu, Shield, ShieldCheck, Sun, Moon } from "lucide-react";
import { useApp, Page, PRESET_THEMES } from "./AppContext";

const PAGE_TITLES: Record<Page, string> = {
  login: "Login",
  register: "Register",
  dashboard: "Dashboard",
  forms: "Form Input",
  "card-editor": "Card Editor",
  "theme-settings": "Theme Settings",
  history: "History",
  "master-data": "Master Data",
  users: "User Management",
  events: "Events",
};

const PAGE_SUBTITLES: Record<Page, string> = {
  login: "",
  register: "",
  dashboard: "Overview of your card generation activity",
  forms: "Enter personal and professional details",
  "card-editor": "Design and customise your digital card",
  "theme-settings": "Customise the platform appearance",
  history: "View and manage previously generated cards",
  "master-data": "Manage reference data: categories, functions and countries",
  users: "Manage admin accounts and role assignments",
  events: "View and manage events",
};

const R = 6;

export function Header() {
  const { page, theme, setTheme, setPage, setSidebarCollapsed, sidebarCollapsed, currentUser } = useApp();

  const toggleTheme = () => {
    // Find active preset key by comparing background and primary colors
    const currentPresetKey = Object.keys(PRESET_THEMES).find(
      key => PRESET_THEMES[key].backgroundColor === theme.backgroundColor &&
             PRESET_THEMES[key].primaryColor === theme.primaryColor
    ) || (theme.isDark ? "midnight" : "light_clean");

    let targetKey = "";
    if (theme.isDark) {
      // Toggle to Light
      if (currentPresetKey === "midnight") targetKey = "light_clean";
      else if (currentPresetKey === "ocean") targetKey = "light_ocean";
      else if (currentPresetKey === "emerald") targetKey = "light_emerald";
      else if (currentPresetKey === "crimson") targetKey = "light_crimson";
      else if (currentPresetKey === "amber") targetKey = "light_amber";
      else if (currentPresetKey === "slate") targetKey = "light_slate";
      else targetKey = "light_clean";
    } else {
      // Toggle to Dark
      if (currentPresetKey === "light_clean") targetKey = "midnight";
      else if (currentPresetKey === "light_ocean") targetKey = "ocean";
      else if (currentPresetKey === "light_emerald") targetKey = "emerald";
      else if (currentPresetKey === "light_crimson") targetKey = "crimson";
      else if (currentPresetKey === "light_amber") targetKey = "amber";
      else if (currentPresetKey === "light_slate") targetKey = "slate";
      else targetKey = "midnight";
    }
    
    setTheme(PRESET_THEMES[targetKey]);
  };

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", gap: 16, flexShrink: 0, height: 60,
      background: theme.headerColor, borderBottom: `1px solid ${theme.borderColor}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="lg:hidden" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, padding: 4, display: "flex" }}>
          <Menu size={18} />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: theme.textColor, margin: 0, lineHeight: 1.2 }}>
              {PAGE_TITLES[page]}
            </h1>
          </div>
          {PAGE_SUBTITLES[page] && (
            <p style={{ fontSize: 12, color: theme.textMutedColor, margin: 0, marginTop: 1 }}>{PAGE_SUBTITLES[page]}</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: R, background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}` }}>
          <Search size={13} style={{ color: theme.textMutedColor }} />
          <input placeholder="Search cards…" style={{ background: "none", border: "none", outline: "none", color: theme.textColor, fontSize: 13, width: 150 }} />
        </div>



        <button onClick={toggleTheme} title={theme.isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ width: 34, height: 34, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, cursor: "pointer" }}>
          {theme.isDark ? <Sun size={15} style={{ color: theme.textMutedColor }} /> : <Moon size={15} style={{ color: theme.textMutedColor }} />}
        </button>

        <button style={{ position: "relative", width: 34, height: 34, borderRadius: R, display: "flex", alignItems: "center", justifyContent: "center", background: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.borderColor}`, cursor: "pointer" }}>
          <Bell size={15} style={{ color: theme.textMutedColor }} />
          <span style={{ position: "absolute", top: 7, right: 7, width: 5, height: 5, borderRadius: "50%", background: theme.primaryColor }} />
        </button>
      </div>
    </header>
  );
}

