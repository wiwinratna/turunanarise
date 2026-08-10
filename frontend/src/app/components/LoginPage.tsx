import { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "./AppContext";
import { Eye, EyeOff, Layers, ArrowRight, Mail, Lock } from "lucide-react";
import { apiLogin } from "../api";
import { toast } from "sonner";

const R = 6;

export function LoginPage() {
  const { setPage, setIsLoggedIn, setCurrentUser, setActiveEventId, brandingSettings } = useApp();

  const titleText = brandingSettings?.title || "Design without limits.";
  const titleWords = titleText.split(" ");
  const firstTitlePart = titleWords.length > 1 ? titleWords.slice(0, titleWords.length - 2).join(" ") + (titleWords.length > 2 ? " " : "") + titleWords[titleWords.length - 2] : "";
  const lastTitlePart = titleWords.length > 1 ? titleWords[titleWords.length - 1] : titleText;
  
  const layoutStyle = brandingSettings?.layout || "split-right";
  const primaryColor = brandingSettings?.primaryColor || "#7c5cfc";
  const bgColor = brandingSettings?.backgroundColor || "#050509";
  const panelColor = brandingSettings?.panelColor || "#0a0a10";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiLogin({ email, password });
      setCurrentUser(user);
      if (user.role === "admin" && user.eventId) {
        const firstEventId = Array.isArray(user.eventId) ? user.eventId[0] : user.eventId;
        if (firstEventId) setActiveEventId(firstEventId);
      }
      setIsLoggedIn(true);
      setPage("dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "12px 14px", color: "#f0f0fa", fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "all 0.2s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: layoutStyle === "split-left" ? "row-reverse" : "row", fontFamily: "'Inter', sans-serif", background: bgColor }}>
      {/* Left panel */}
      {layoutStyle !== "centered" && (
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
          style={{ background: panelColor }}>
          {/* Subtle mesh gradient background */}
          {brandingSettings?.backgroundImage ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${brandingSettings.backgroundImage})`, opacity: 0.6 }} />
          ) : (
            <div className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(circle at 15% 50%, ${primaryColor}25, transparent 25%), radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 25%)`,
                filter: "blur(60px)"
              }} />
          )}

        <div className="relative z-10 flex flex-col h-full" style={{ padding: "48px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${primaryColor}, #5a3dcc)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${primaryColor}40` }}>
              <Layers size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>Arise 2</span>
          </div>

          {!brandingSettings?.backgroundImage && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            {/* Blue Ring */}
            <motion.div
              style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: "2px solid #3b82f6", opacity: 0.35, boxShadow: "0 0 60px rgba(59, 130, 246, 0.2), inset 0 0 30px rgba(59, 130, 246, 0.2)" }}
              animate={{ y: [0, -60, 0], x: [0, 40, 0], rotate: [0, 90, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              initial={{ top: "5%", left: "5%" }}
            />
            {/* Yellow Ring */}
            <motion.div
              style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", border: "2px solid #facc15", opacity: 0.3, boxShadow: "0 0 60px rgba(250, 204, 21, 0.2), inset 0 0 30px rgba(250, 204, 21, 0.2)" }}
              animate={{ y: [0, 80, 0], x: [0, -60, 0], rotate: [0, -60, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
              initial={{ top: "60%", left: "75%" }}
            />
            {/* White/Silver Ring */}
            <motion.div
              style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: "2px solid #f3f4f6", opacity: 0.25, boxShadow: "0 0 40px rgba(243, 244, 246, 0.15), inset 0 0 20px rgba(243, 244, 246, 0.15)" }}
              animate={{ y: [0, -40, 0], x: [0, 50, 0], rotate: [0, 120, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 4 }}
              initial={{ top: "75%", left: "10%" }}
            />
            {/* Green Ring */}
            <motion.div
              style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", border: "2px solid #22c55e", opacity: 0.3, boxShadow: "0 0 60px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.2)" }}
              animate={{ y: [0, 50, 0], x: [0, -80, 0], rotate: [0, -90, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
              initial={{ top: "10%", left: "65%" }}
            />
            {/* Red Ring */}
            <motion.div
              style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "2px solid #ef4444", opacity: 0.35, boxShadow: "0 0 60px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.2)" }}
              animate={{ y: [0, -70, 0], x: [0, -40, 0], rotate: [0, 180, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 3 }}
              initial={{ top: "45%", left: "40%" }}
            />
          </div>
          )}

          <div style={{ marginBottom: "auto", paddingTop: "10vh", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 56, fontWeight: 300, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24 }}>
              {firstTitlePart}<br />
              <span style={{ fontWeight: 600, color: primaryColor }}>{lastTitlePart}</span>
            </h2>
            <p style={{ color: "#8b8b9f", fontSize: 16, lineHeight: 1.6, maxWidth: 320, fontWeight: 400 }}>
              {brandingSettings?.subtitle || "The modern workspace for premium digital card creation."}
            </p>
          </div>
        </div>
        </div>
      )}

      {/* Right panel — auth form */}
      <div style={{ flex: "0 0 auto", width: "100%", maxWidth: layoutStyle === "centered" ? "none" : 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 48px", background: layoutStyle === "centered" ? "transparent" : bgColor }}>
        <motion.div initial={{ opacity: 0, y: layoutStyle === "centered" ? 16 : 0, x: layoutStyle === "centered" ? 0 : (layoutStyle === "split-left" ? -16 : 16) }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.35 }} style={{ width: "100%", maxWidth: 360, background: layoutStyle === "centered" ? panelColor : "transparent", padding: layoutStyle === "centered" ? "40px" : 0, borderRadius: layoutStyle === "centered" ? 16 : 0, border: layoutStyle === "centered" ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
          {/* Mobile logo or Centered Logo */}
          <div className={`flex items-center gap-3 mb-8 ${layoutStyle === "centered" ? "justify-center mb-12" : "lg:hidden"}`}>
            <div style={{ width: layoutStyle === "centered" ? 40 : 30, height: layoutStyle === "centered" ? 40 : 30, borderRadius: R, background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={layoutStyle === "centered" ? 20 : 14} color="#fff" /></div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: layoutStyle === "centered" ? 24 : 16, color: "#f0f0fa" }}>Arise 2</span>
          </div>

          {layoutStyle !== "centered" && (
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: "#8b8b9f", margin: 0, fontWeight: 400 }}>
                Sign in to your workspace
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#8b8b9f", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>EMAIL ADDRESS</label>
              <div style={{ position: "relative" }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle} placeholder="name@company.com" />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#8b8b9f", letterSpacing: "0.05em", display: "block", margin: 0 }}>PASSWORD</label>
                <button type="button" style={{ fontSize: 11, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>Forgot?</button>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 40 }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b8b9f", display: "flex", padding: 4 }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "12px", background: primaryColor, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 8, transition: "background 0.2s"
              }}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7070a0", margin: 0, fontWeight: 400 }}>
              Need an admin account?{" "}
              <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#c4b5fd"} onMouseOut={e => e.currentTarget.style.color = "#a78bfa"}>
                Contact Sales
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
