import { useApp } from "./AppContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ChatWidget } from "./ChatWidget";
import { DashboardHome } from "./pages/DashboardHome";
import { FormsPage } from "./pages/FormsPage";
import { CardEditorPage } from "./pages/CardEditorPage";
import { ThemeSettingsPage } from "./pages/ThemeSettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MasterDataPage } from "./pages/MasterDataPage";
import { UsersPage } from "./pages/UsersPage";
import { EventsPage } from "./pages/EventsPage";
import { SuperadminEventsPage } from "./pages/SuperadminEventsPage";
import { LoginBrandingPage } from "./pages/LoginBrandingPage";
import { AnimatePresence, motion } from "motion/react";

export function DashboardLayout() {
  const { page, theme } = useApp();
  const isEditor = page === "card-editor";

  const renderPage = () => {
    switch (page) {
      case "dashboard":      return <DashboardHome />;
      case "forms":          return <FormsPage />;
      case "card-editor":    return <CardEditorPage />;
      case "theme-settings": return <ThemeSettingsPage />;
      case "profile":        return <ProfilePage />;
      case "master-data":    
      case "superadmin-countries": return <MasterDataPage />;
      case "users":          return <UsersPage />;
      case "events":         return <EventsPage />;
      case "superadmin-events": return <SuperadminEventsPage />;
      case "login-branding": return <LoginBrandingPage />;
      default:               return <DashboardHome />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: theme.backgroundColor, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Header />
        <main style={{ flex: 1, overflowY: isEditor ? "hidden" : "auto", overflowX: "hidden", display: "flex", flexDirection: "column", background: theme.backgroundColor }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", height: isEditor ? "100%" : undefined, overflow: isEditor ? "hidden" : undefined }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
