import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, Page } from "./AppContext";
import {
  LayoutDashboard, FileText, CreditCard, Palette, History,
  ChevronLeft, ChevronRight, Upload, X, LogOut, Database, Layers,
  Users, CalendarDays, Shield, ShieldCheck, User, Globe, LayoutTemplate
} from "lucide-react";

import { useIsMobile } from "./ui/use-mobile";

export function Sidebar() {
  const { page, setPage, theme, sidebarCollapsed, setSidebarCollapsed, sidebarLogo, setSidebarLogo, currentUser, setCurrentUser, setIsLoggedIn, events } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const getBrandName = () => {
    if (currentUser?.role === 'admin' && currentUser?.eventId) {
      const eventIds = Array.isArray(currentUser.eventId) ? currentUser.eventId : [currentUser.eventId];
      if (eventIds.length > 0) {
        const ev = events.find(e => e.id === eventIds[0]);
        if (ev) return ev.name;
      }
    }
    return "Arise 2";
  };
  const isSuperadmin = currentUser?.role === "superadmin";

  const NAV_GROUPS = [
    {
      label: "MAIN",
      items: [
        { id: "dashboard" as Page, label: "Dashboard", icon: <LayoutDashboard size={16} /> },
        ...(isSuperadmin 
          ? [{ id: "superadmin-events" as Page, label: "Events", icon: <CalendarDays size={16} /> }] 
          : [{ id: "events" as Page, label: "Participants", icon: <Users size={16} /> }]
        ),
        ...(isSuperadmin ? [] : [
          { id: "forms" as Page, label: "Forms", icon: <FileText size={16} /> },
          { id: "card-editor" as Page, label: "Card Editor", icon: <CreditCard size={16} /> },
        ]),
      ],
    },
    {
      label: "CONFIGURATION",
      items: [
        ...(isSuperadmin 
          ? [
              { id: "superadmin-countries" as Page, label: "Countries", icon: <Globe size={16} /> },
              { id: "users" as Page, label: "Users", icon: <Users size={16} /> },
              { id: "login-branding" as Page, label: "Login Branding", icon: <LayoutTemplate size={16} /> }
            ]
          : [
              { id: "master-data" as Page, label: "Master Data", icon: <Database size={16} /> }
            ]),
        { id: "theme-settings" as Page, label: "Theme", icon: <Palette size={16} /> },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        { id: "profile" as Page, label: "Profile", icon: <User size={16} /> },
      ],
    },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSidebarLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setPage("login");
  };

  const isMobile = useIsMobile();
  const collapsed = isMobile ? false : sidebarCollapsed;

  if (isMobile && sidebarCollapsed) {
    return null; // hide completely on mobile when collapsed
  }

  const navBtn = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", border: "none", cursor: "pointer",
    padding: collapsed ? "8px 0" : "8px 10px",
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: 6,
    background: active ? theme.primaryColor : "transparent",
    color: active ? "#ffffff" : theme.textMutedColor,
    fontSize: 13, fontWeight: active ? 600 : 400,
    transition: "background 0.15s, color 0.15s",
  });



  return (
    <>
      {isMobile && !sidebarCollapsed && (
        <div 
          onClick={() => setSidebarCollapsed(true)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
        />
      )}
      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        style={{
          display: "flex", flexDirection: "column", height: "100%",
          overflow: "hidden", flexShrink: 0,
          background: theme.sidebarColor,
          borderRight: `1px solid ${theme.borderColor}`,
          position: isMobile ? "fixed" : "relative",
          zIndex: 50,
          left: 0, top: 0, bottom: 0,
        }}>

      {/* Logo / Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
        borderBottom: `1px solid ${theme.borderColor}`, height: 60, flexShrink: 0,
      }}>
        {sidebarLogo ? (
          <div className="relative group" style={{ flexShrink: 0 }}>
            <img src={sidebarLogo} alt="Logo" style={{ maxWidth: 100, height: 34, borderRadius: 6, objectFit: "contain" }} />
            {!collapsed && (
              <button onClick={() => setSidebarLogo(null)}
                style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#e53e5e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={9} color="#fff" />
              </button>
            )}
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            title="Upload logo"
            style={{ width: 34, height: 34, borderRadius: 6, background: theme.primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
            <Layers size={16} color="#fff" />
          </button>
        )}

        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 160 }} exit={{ opacity: 0, width: 0 }}
              style={{ overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              {sidebarLogo && (
                <div style={{ width: 1, height: 24, background: theme.borderColor, flexShrink: 0 }} />
              )}
              <div>
                <div style={{ 
                  fontFamily: "'Poppins', sans-serif", 
                  fontWeight: 700, 
                  fontSize: getBrandName().length > 18 ? 12 : 15, 
                  color: theme.textColor, 
                  whiteSpace: "normal", 
                  overflow: "hidden", 
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: 1.2
                }}>
                  {getBrandName()}
                </div>
                <button onClick={() => fileRef.current?.click()}
                  style={{ fontSize: 10, color: theme.textMutedColor, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                  <Upload size={8} />
                  {sidebarLogo ? "Change logo" : "Upload logo"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 10, fontWeight: 700, color: theme.isDark ? "#505070" : "#94a3b8", letterSpacing: "0.1em", padding: "8px 10px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>
            {group.items.map(item => {
              const active = page === item.id;
              return (
                <div key={item.id} style={{ position: "relative" }} className="group">
                  <button onClick={() => setPage(item.id)} style={navBtn(active)}>
                    <span style={{ flexShrink: 0, color: active ? "#fff" : theme.textMutedColor }}>{item.icon}</span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden" }}>
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && item.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: active ? "rgba(255,255,255,0.22)" : theme.primaryColor, color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                  {/* Tooltip */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap"
                      style={{ background: theme.cardColor, color: theme.textColor, border: `1px solid ${theme.borderColor}`, fontSize: 12, fontWeight: 500, top: "50%", transform: "translateY(-50%)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
            {!collapsed && <div style={{ height: 1, background: theme.borderColor, margin: "6px 0" }} />}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${theme.borderColor}`, padding: "8px 8px" }}>
        <button onClick={() => setSidebarCollapsed(!collapsed)}
          style={{ ...navBtn(false), marginBottom: 4 }}>
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: collapsed ? "8px 0" : "8px 10px", justifyContent: collapsed ? "center" : "flex-start" }}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar}
              alt="User" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: theme.primaryColor + "20", color: theme.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={16} />
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: theme.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                    {currentUser?.name || "User"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: theme.textMutedColor, whiteSpace: "nowrap" }}>
                  {currentUser?.role === "superadmin" ? "Super Admin" : "Event Admin"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button onClick={handleLogout}
              title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMutedColor, padding: 4, display: "flex" }}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
    </>
  );
}
